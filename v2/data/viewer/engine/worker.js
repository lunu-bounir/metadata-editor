/* global parseMetadata, writeMetadata */
import {parseMetadata, writeMetadata} from './vendor/@uswriting/exiftool/dist/esm/index.js';

/* ZeroPerl selects the WASM loading path based on the presence of window and document */
self.window = self;
self.alert = e => console.info('[error]', e);
self.document = {};

const WASM_HREF = new URL('./vendor/@6over3/zeroperl-ts/dist/esm/zeroperl.wasm', self.location.href);

const fetch_ = url => url.endsWith('zeroperl.wasm') ? fetch(WASM_HREF) : fetch(url);

const parse = (file, args = []) => parseMetadata(file, {
  args,
  fetch: fetch_
});

const version = () => parse({
  name: 'null.txt',
  data: new TextEncoder().encode('version\n')
}, ['-ver']);

/* remote descriptors are streamed to a Blob with progress reporting */
const resolveFile = async (file, requestId) => {
  if (file.type !== 'remote') {
    return file;
  }

  const r = await fetch(file.href).catch(e => {
    throw Error(e.message + ': ' + file.href);
  });

  if (!r.ok) {
    throw Error(`Status code ${r.status} while downloading ${file.href}`);
  }

  const contentLength = r.headers.get('content-length');

  // Create a blob to store the data
  const chunks = [];
  let receivedLength = 0;

  const reader = r.body.getReader();
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;

    chunks.push(value);
    receivedLength += value.length;

    if (requestId) {
      self.postMessage({
        id: requestId,
        type: 'report',
        href: file.href,
        receivedLength,
        contentLength
      });
    }
  }

  return {
    name: file.name,
    data: new Blob(chunks)
  };
};

const handle = async request => {
  if (request.cmd === 'parse') {
    try {
      const file = await resolveFile(request.file, request.id);
      const r = await parse(file, request.args);

      if (r.success) {
        self.postMessage({
          id: request.id,
          response: r.data
        });
      }
      else {
        self.postMessage({
          id: request.id,
          error: r.error || 'Unknown error'
        });
      }
    }
    catch (e) {
      console.error('[worker]', e);
      self.postMessage({
        id: request.id,
        // engine crash; the page restarts the worker on this message
        error: 'Perl exited with exit status 255\n' + e.message
      });
    }
  }
  else if (request.cmd === 'write') {
    try {
      const file = await resolveFile(request.file, request.id);
      const r = await writeMetadata(file, request.tags, {
        args: request.args,
        fetch: fetch_
      });

      if (r.success) {
        self.postMessage({
          id: request.id,
          /* writeMetadata returns an ArrayBuffer; pulling it into a Uint8Array
             keeps it compatible with parseMetadata Binaryfile.data */
          response: new Uint8Array(r.data)
        });
      }
      else {
        self.postMessage({
          id: request.id,
          error: r.error || 'Unknown error'
        });
      }
    }
    catch (e) {
      console.error('[worker]', e);
      self.postMessage({
        id: request.id,
        error: 'Perl exited with exit status 255\n' + e.message
      });
    }
  }
  else if (request.cmd === 'version') {
    try {
      const r = await version();
      const [, v] = (r.data || '').match(/ExifTool Version Number\s*: (.+)/) || [];
      self.postMessage({
        id: request.id,
        response: v || (r.data || '').split('\n')[0].trim()
      });
    }
    catch (e) {
      console.error('[worker]', e);
      self.postMessage({
        id: request.id,
        error: e.message
      });
    }
  }
};

let chain = Promise.resolve();
const queue = task => {
  chain = chain.then(task).catch(e => console.error('[worker]', e));
};

self.onmessage = e => queue(() => handle(e.data));

/* warm-up; notify the page when the WASM runtime is ready */
queue(async () => {
  try {
    await version();
  }
  catch (e) {
    console.error('[worker]', e);
  }
  self.postMessage({
    cmd: 'ready'
  });
});
