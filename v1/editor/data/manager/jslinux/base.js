/* global _malloc, HEAPU8 */

// eslint-disable-next-line camelcase, no-unused-vars
function update_downloading(b) {
  document.getElementById('blink').dataset.reading = b;
}

// eslint-disable-next-line no-var
var os = {
  run(cmd, prepend = '\n') { // 'ls'
    if (os.busy) {
      return Promise.reject(Error('BUSY'));
    }
    delete os.resolve;

    return new Promise(resolve => {
      os.busy = true;
      os.resolve = resolve;

      const write = Module.cwrap('console_queue_char', null, ['number']);
      for (const ch of (cmd + prepend)) {
        write(ch.charCodeAt(0));
      }
    });
  },
  async disk(cmd) { // cmd = {command: 'write', ...}
    let buffer;
    if (cmd.href) {
      buffer = new Uint8Array(await fetch(cmd.href).then(r => r.arrayBuffer()));
    }
    else if (cmd.content) {
      const enc = new TextEncoder();
      buffer = enc.encode(cmd.content);
    }
    else if (cmd.buffer) {
      buffer = new Uint8Array(cmd.buffer);
    }

    const size = buffer.length;
    const address = _malloc(size);
    HEAPU8.set(buffer, address);

    Module.cwrap('fs_import_file', null, ['string', 'number', 'number'])(cmd.name, address, size);
  }
};

// eslint-disable-next-line no-var
var term = {
  debug: true,
  stdout: '',
  stderr: '',
  write(str) {
    if (str.startsWith('[root@localhost ~]# ')) {
      if (os.resolve) {
        os.busy = false;
        os.resolve({
          stdout: term.stdout,
          stderr: term.stderr
        });
      }
      else {
        document.dispatchEvent(new Event('booted'));
      }
      term.stdout = '';
      term.stderr = '';
    }
    else {
      term.stdout += str;
    }
  },
  getSize() {
    return {width: 1000, height: 2};
  }
};

// eslint-disable-next-line no-var
var Module = {
  preRun() {
    navigator.serviceWorker.register('sw.js', {
    }).then(() => {
      Module.ccall(
        'vm_start',
        null,
        /* [url, mem_size, cmdline, pwd, width, height, (net_state != null) | 0, drive_url] */
        ['string', 'number', 'string', 'string', 'number', 'number', 'number', 'string'],
        ['https://example.com/jslinux/setup.cfg', 128, '', null, 0, 0, 1, '']);
    });
  }
};
