const worker = {
  onReady: [],
  onMessage: []
};
{
  const reset = () => {
    const w = new Worker('engine/worker.js');
    worker.post = (...args) => w.postMessage(...args);
    w.onmessage = onmessage;
    worker.ready = false;
  };

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

// eslint-disable-next-line no-unused-vars
class ExifTool {
  waitings = [];
  #resolves = {};
  #rejects = {};

  #post(o) {
    return new Promise((resolve, reject) => {
      const id = Math.random();
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
          this.report(request);
          return;
        }
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
  ready() {
    if (worker.ready) {
      return Promise.resolve();
    }
    return new Promise(resolve => worker.onReady.push(resolve));
  }
  upload(files) {
    return this.#post({
      cmd: 'upload',
      files
    });
  }
  delete(file) {
    return this.#post({
      filename: file.name,
      cmd: 'delete'
    });
  }
  umount() {
    return this.#post({
      cmd: 'umount'
    });
  }
  execute(code) {
    return this.#post({
      cmd: 'execute',
      code
    });
  }
}
