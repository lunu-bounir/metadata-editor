/* global proceed, save, term */

const display = (file, result, writable) => {
  const entry = document.importNode(document.getElementById('entry').content, true);

  entry.querySelector('h2 span').textContent = file.name;
  entry.querySelector('h2 input[data-cmd=save]').dataset.write = writable;

  for (const [tag, {value, groups, writable}] of result.entries()) {
    const e = document.importNode(document.getElementById('tag').content, true);
    const [a, c] = e.querySelectorAll('span');
    a.textContent = tag;
    a.title = groups.filter(s => s.trim()).join(' -> ');
    c.textContent = value;

    e.querySelector('input').disabled = writable === false;

    entry.querySelector('div.tags').append(e);
  }

  entry.querySelector('div').file = file;

  document.body.classList.remove('empty');
  document.getElementById('entries').append(entry);
};

document.getElementById('input').onchange = e => {
  proceed(e.target.files);
};
document.ondragover = e => e.preventDefault();
document.ondrop = e => {
  e.preventDefault();
  proceed(e.dataTransfer.files);
};

// remove
document.addEventListener('click', e => {
  const cmd = e.target.dataset.cmd;

  if (cmd === 'remove') {
    const entry = e.target.closest('.entry');
    entry.querySelector('[data-cmd=save]').disabled = false;

    entry['removed-tags'] = entry['removed-tags'] || new Set();
    const tag = e.target.closest('.tag');
    entry['removed-tags'].add(tag.querySelector('span').textContent);
    tag.remove();
  }
  else if (cmd === 'save') {
    const entry = e.target.closest('.entry');

    save({
      target: e.target,
      file: entry.file,
      tags: entry['removed-tags']
    });
  }
  else if (cmd === 'delete') {
    const entry = e.target.closest('.entry');
    entry.remove();
  }
  else if (cmd === 'remove-all') {
    const entry = e.target.closest('.entry');
    for (const e of entry.querySelectorAll(`[data-cmd="remove"]:not(disabled)`)) {
      e.click();
    }
  }
  else if (document.body.classList.contains('empty')) {
    document.getElementById('input').click();
  }
});

{
  const log = document.getElementById('log');
  term.write = new Proxy(term.write, {
    apply(target, self, args) {
      const [str] = args;
      log.textContent += str;
      log.scrollTop = log.scrollHeight;
      return Reflect.apply(target, self, args);
    }
  });
}
