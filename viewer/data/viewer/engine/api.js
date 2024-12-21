const worker = new Worker('engine/worker.js');
worker.onmessage = e => {
  const request = e.data;

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
worker.onReady = [];
worker.onMessage = [];

// eslint-disable-next-line no-unused-vars
class ExifTool {
  waitings = [];
  #resolves = {};

  #post(o) {
    return new Promise(resolve => {
      const id = Math.random();
      this.#resolves[id] = resolve;
      worker.postMessage({
        ...o,
        id
      });
    });
  }

  constructor() {
    worker.onMessage.push(request => {
      if (request.id in this.#resolves) {
        this.#resolves[request.id](request.response);
        delete this.#resolves[request.id];
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
