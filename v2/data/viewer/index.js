/* global ExifTool */

// exiftool -listw && exiftool -listd

const args = new URLSearchParams(location.search);
const viewer = document.getElementById('files');
let introMsg = viewer.dataset.msg;

const exiftool = new ExifTool();
let progress = '';
exiftool.report = o => {
  let msg = `Downloading ${o.href}`;
  document.title = progress + ' ' + msg;

  msg += ' ...';
  viewer.dataset.msg = msg;
};

const explore = (file, scan = 0) => exiftool.ready().then(async () => {
  const args = ['-json', '-a', '-g1', '-charset', 'utf8'];

  if (scan === 1) {
    args.push('-fast');
  }
  else if (scan > 1) {
    args.push('-fast' + scan);
  }

  const raw = await exiftool.parse(file, args);

  if (!raw) {
    throw Error('Engine is unavailable right now.');
  }

  const data = JSON.parse(raw)[0];

  // convert the flat grouped object into the {group: {tag: {label, value}}} structure
  const meta = {};
  for (const [group, entries] of Object.entries(data)) {
    if (group === 'SourceFile') {
      continue;
    }
    meta[group] = {};
    for (const [tag, value] of Object.entries(entries)) {
      meta[group][tag] = {
        label: tag,
        value: Array.isArray(value) ? value.join(', ') : value
      };
    }
  }

  return meta;
});

let tagJson;

const writeable = async () => tagJson ||= await fetch('const.json').then(r => r.json());

const insert = async (file, groups, descriptor, replace = null) => {
  const {deletableGroups, writableTags} = await writeable();

  // never allow editing these tags (prevents renaming the tmp file)
  const readonlyTags = new Set(['FileName']);

  const fragment = document.importNode(document.getElementById('file').content, true);
  const ef = fragment.querySelector('.file');
  const header = ef.querySelector('.header');
  const errorBox = ef.querySelector('.error');
  ef.edits = new Map();
  ef.querySelector('h2').textContent = file.name;
  const save = ef.querySelector('.save');

  const showError = msg => {
    errorBox.replaceChildren(...[
      msg,
      Object.assign(document.createElement('button'), {
        type: 'button',
        className: 'close',
        textContent: '\u00d7',
        title: 'Dismiss',
        onclick: () => errorBox.hidden = true
      })
    ]);
    errorBox.hidden = false;
  };

  const refresh = () => {
    save.disabled = ef.edits.size === 0;
    header.classList.toggle('has-edits', ef.edits.size !== 0);
  };

  const edit = (span, group, tag, value) => {
    if (span.querySelector('input')) {
      return;
    }
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.setAttribute('aria-label', group + ':' + tag);

    const commit = () => {
      const key = `${group}:${tag}`;
      if (input.value === String(value)) {
        ef.edits.delete(key);
        span.textContent = value;
        span.classList.remove('edited', 'removed');
      }
      else if (input.value === '') {
        ef.edits.set(key, '');
        span.textContent = value;
        span.classList.add('edited', 'removed');
      }
      else {
        ef.edits.set(key, input.value);
        span.textContent = input.value;
        span.classList.add('edited');
        span.classList.remove('removed');
      }
      refresh();
    };

    input.addEventListener('keydown', e => e.key === 'Enter' && input.blur());
    input.addEventListener('blur', commit, {once: true});

    span.textContent = '';
    span.dataset.original = value;
    span.append(input);
    input.focus();
  };

  for (const [group, entires] of Object.entries(groups)) {
    if (group === 'ExifTool') {
      continue;
    }

    const writable = deletableGroups.includes(group);
    const eg = document.importNode(document.getElementById('group').content, true);
    eg.querySelector('summary').textContent = group + (writable ? '' : ' (readonly)');

    for (const [tag, o] of Object.entries(entires)) {
      // ignore the "FileSize", "FilePermissions" and "Directory" Tag of the "File" group
      if (['Directory', 'FilePermissions', 'FileAccessDate', 'FileInodeChangeDate', 'FileModifyDate']
        .includes(tag) && group === 'System') {
        continue;
      }
      const et = document.importNode(document.getElementById('tag').content, true);
      const [en, ev, ew] = et.querySelectorAll('span');
      en.textContent = o.label + (o.instance ? ` (${o.instance})` : '');
      en.classList.add('d1');
      ev.textContent = o.value;
      ev.classList.add('d2');
      if (writableTags.includes(tag) && !readonlyTags.has(tag)) {
        ev.classList.add('writable');
        ev.addEventListener('click', () => edit(ev, group, tag, o.value));
        ew.remove();
      }
      else {
        ew.textContent = '(readonly)';
      }
      if (ew.isConnected) {
        ew.classList.add('d3');
      }
      et.querySelector('div').dataset.tag = tag;
      eg.querySelector('div').append(et);
    }
    ef.querySelector('.groups').append(eg);
  }

  save.addEventListener('click', async () => {
    if (!ef.edits.size) {
      return;
    }
    save.disabled = true;
    try {
      const tags = Object.fromEntries(ef.edits);
      const bytes = await exiftool.write(descriptor, tags);
      const blob = new Blob([bytes]);

      const modified = {
        name: file.name,
        data: blob
      };
      let meta;
      for (let scan = 0; ; scan += 1) {
        try {
          meta = await explore(modified, scan);
          break;
        }
        catch (e) {
          if (scan < 3) {
            await exiftool.ready();
          }
          else {
            throw e;
          }
        }
      }
      if ('System' in meta) {
        meta['System']['FastScan'] = {
          label: 'Fast Scan',
          value: 0
        };
      }

      const section = await insert({name: file.name}, meta, modified, ef);

      const a = section.querySelector('.download');
      a.href = URL.createObjectURL(new File([bytes], file.name));
      a.download = file.name;
      a.textContent = 'Download It';
      a.hidden = false;
      errorBox.hidden = true;
    }
    catch (e) {
      console.error(e);
      showError(`Cannot update "${file.name}"\n\n--\nError: ` + e.message);
      save.disabled = false;
    }
  });

  if (replace) {
    viewer.replaceContent(replace.dataset.tabId, ef);
  }
  else {
    ef.dataset.tabId = viewer.add({title: file.name, content: ef});
  }

  return ef;
};

let stopped = false;
let batches = 0;
const workingBox = document.getElementById('working');
const workingMsg = workingBox.querySelector('span');
document.getElementById('stop').onclick = () => {
  if (workingBox.hidden) {
    return;
  }
  stopped = true;
  workingMsg.textContent = 'Stopping...';
};

const next = async files => {
  const list = [...files];
  const total = list.length;

  viewer.dataset.msg = 'Please wait while loading resources...';
  batches += 1;
  if (total) {
    workingMsg.textContent = 'Starting...';
    workingBox.hidden = false;
  }

  try {
    for (const [index, file] of list.entries()) {
      if (stopped) {
        break;
      }
      progress = `[${index + 1}/${total}]`;
      const title = progress + ' Working on ' + file.name;
      document.title = title;
      workingMsg.textContent = title;

      try {
        // in case of error, increase the fast scan value
        for (let scan = 0; ; scan += 1) {
          try {
            const meta = await explore(file, scan);
            // add FastScan value to metadata
            if ('System' in meta) {
              meta['System']['FastScan'] = {
                label: 'Fast Scan',
                value: scan
              };
            }
            insert(file, meta, file);
            break;
          }
          catch (e) {
            if (!stopped && scan < 3) {
              console.log('[explore]', e);

              await exiftool.ready();
            }
            else {
              throw e;
            }
          }
        }
      }
      catch (e) {
        console.error(e);
        const msg = `Cannot read meta information from "${file.name}" file.\n\n--\nError: ` + e.message;
        viewer.dataset.msg = msg;

        const ef = document.importNode(document.getElementById('file').content, true);
        ef.querySelector('h2').textContent = file.name + ' (Failed)';
        const pre = document.createElement('pre');
        pre.textContent = msg;
        ef.querySelector('.groups').append(pre);
        viewer.add({title: file.name + ' (Failed)', content: ef});
      }
    }
  }
  finally {
    batches -= 1;
    if (batches === 0) {
      progress = '';
      stopped = false;
      workingBox.hidden = true;
      document.title = chrome.runtime.getManifest().name;
    }
  }
};

document.getElementById('input').onchange = e => {
  next(e.target.files);
};
document.addEventListener('click', e => {
  if (e.detail === 1) {
    return;
  }
  const path = e.composedPath();
  let first = path[0];
  if (first instanceof Element && first.shadowRoot) {
    first = null;
  }
  const empty = viewer.shadowRoot.querySelector('.empty');
  // something inside the tabs-view component (tab strip, panels) was hit
  if (path.includes(viewer) && !(empty && path.includes(empty))) {
    return;
  }
  if (first instanceof Element && first.closest('input, button, a, summary')) {
    return;
  }
  document.getElementById('input').click();
});
document.ondragover = e => e.preventDefault();
document.ondrop = e => {
  e.preventDefault();
  const getEntry = o => o.getAsEntry?.() || o.webkitGetAsEntry?.();
  const entries = [...e.dataTransfer.items].map(getEntry).filter(Boolean);
  const files = [];
  const errors = [];

  const dir = entry => {
    const reader = entry.createReader();
    // readEntries returns at most 100 entries per call; keep reading until empty
    return new Promise((resolve, reject) => {
      const all = [];
      const step = () => reader.readEntries(batch => {
        if (batch.length === 0) {
          return resolve(all);
        }
        all.push(...batch);
        step();
      }, reject);
      step();
    });
  };

  const walk = async entry => {
    if (entry.isFile) {
      try {
        const file = await new Promise((resolve, reject) => {
          entry.file(resolve, reject);
        });
        files.push(file);
      }
      catch (e) {
        console.warn('Cannot access', entry.fullPath, e);
        errors.push(`Skipped "${entry.fullPath}"\n--\nError: ${e.message || e}`);
      }
      return;
    }

    for (const e of await dir(entry)) {
      await walk(e);
    }
  };

  const add = async list => {
    for (const entry of list) {
      await walk(entry);
    }
  };

  add(entries).then(() => {
    if (errors.length) {
      const ef = document.importNode(document.getElementById('file').content, true);
      ef.querySelector('h2').textContent = 'Skipped files';
      const pre = document.createElement('pre');
      pre.textContent = errors.join('\n\n');
      ef.querySelector('.groups').append(pre);
      viewer.add({
        title: errors.length + ' skipped',
        content: ef
      });
    }
    return next(files);
  });
};

exiftool.ready().then(async () => {
  if (args.has('href')) {
    const hrefs = args.getAll('href').map(href => {
      const name = href.split('/').pop() || (Math.random() + 1).toString(36).substring(7);
      return {
        name,
        type: 'remote',
        href
      };
    });
    next(hrefs);
  }
  else {
    const version = await exiftool.version();

    introMsg = viewer.dataset.msg.slice(0, -3) + 'Based on ExifTool v.' + version;
    viewer.dataset.msg = introMsg;
  }
});

viewer.addEventListener('tabs-empty', () => {
  viewer.dataset.msg = introMsg;
});
