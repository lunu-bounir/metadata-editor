const worker = {
  onReady: [],
  onMessage: []
};
{
  let w;
  const reset = () => {
    w?.terminate();
    w = new Worker('engine/worker.js', {
      type: 'module'
    });
    worker.post = (...args) => w.postMessage(...args);
    w.onmessage = onmessage;
    worker.ready = false;
  };

  worker.restart = reset;

  const onmessage = e => {
    const request = e.data;

    if (request.error) {
      reset();
    }

    if (request.cmd === 'ready') {
      worker.ready = true;

      for (const c of worker.onReady) {
        c();
      }
      worker.onReady.length = 0;
    }
    for (const c of worker.onMessage) {
      c(request);
    }
  };

  reset();
}

const ENGINE_TIMEOUT = 60 * 1000;

// eslint-disable-next-line no-unused-vars
class ExifTool {
  waitings = [];
  #resolves = {};
  #rejects = {};
  #deadlines = {};
  #watchdog = setInterval(() => {
    const now = Date.now();
    for (const id of Object.keys(this.#deadlines)) {
      if (now > this.#deadlines[id]) {
        delete this.#deadlines[id];
        const reject = this.#rejects[id];
        delete this.#resolves[id];
        delete this.#rejects[id];
        reject?.(Error('Engine timed out'));
        worker.restart();
      }
    }
  }, 1000);

  #post(o, timeout = ENGINE_TIMEOUT) {
    return new Promise((resolve, reject) => {
      const id = Math.random();
      this.#deadlines[id] = Date.now() + timeout;
      this.#resolves[id] = resolve;
      this.#rejects[id] = reject;
      worker.post({
        ...o,
        id
      });
    });
  }

  report(o) {
    console.info('[api]', o);
  }
  constructor() {
    worker.onMessage.push(request => {
      if (request.id in this.#resolves) {
        if (request.type === 'report') {
          this.#deadlines[request.id] = Date.now() + ENGINE_TIMEOUT;
          this.report(request);
          return;
        }
        delete this.#deadlines[request.id];
        if (request.error) {
          this.#rejects[request.id](Error(request.error));
        }
        else {
          this.#resolves[request.id](request.response);
        }
        delete this.#resolves[request.id];
        delete this.#rejects[request.id];
      }
    });
  }
  ready(timeout = ENGINE_TIMEOUT) {
    if (worker.ready) {
      return Promise.resolve();
    }
    return new Promise(resolve => {
      let timer;
      const res = () => {
        clearTimeout(timer);
        resolve();
      };
      timer = setTimeout(() => {
        const index = worker.onReady.indexOf(res);
        if (index !== -1) {
          worker.onReady.splice(index, 1);
        }
        worker.restart();
        resolve();
      }, timeout);
      worker.onReady.push(res);
    });
  }
  parse(file, args = []) {
    return this.#post({
      cmd: 'parse',
      args,
      file
    });
  }
  write(file, tags, args = []) {
    return this.#post({
      cmd: 'write',
      args,
      file,
      tags
    });
  }
  version() {
    return this.#post({
      cmd: 'version'
    });
  }
}
