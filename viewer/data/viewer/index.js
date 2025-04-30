/* global ExifTool */

// exiftool -listw && exiftool -listd

const args = new URLSearchParams(location.search);
const exiftool = new ExifTool();
exiftool.report = o => {
  let msg = `Downloading ${o.href}`;
  document.title = msg;

  if (o.contentLength) {
    const progress = (o.receivedLength / parseInt(o.contentLength)) * 100;
    msg += ' (' + progress.toFixed(2) + '%)...';
  }
  else {
    msg += ' ' + o.receivedLength + ' bytes...';
  }
  document.getElementById('files').dataset.msg = msg;
};

const explore = file => exiftool.ready().then(async () => {
  const raw = await exiftool.execute(`
    my $exifTool = Image::ExifTool->new;
    $exifTool->ExtractInfo("/work/${file.name}");
    my @groups = $exifTool->GetGroups();

    my @r = ();
    foreach my $group (@groups) {
      my $writable = grep { $_ eq $group } @deleteGroups;
      push(@r, "[G]$group");

      my $info = $exifTool->GetInfo({"Group" => $group});
      my @tags = $exifTool->GetTagList($info);
      foreach my $tag (@tags) {
        my $name = $exifTool->GetDescription($tag);
        my $value = $exifTool->GetValue($tag);
        push(@r, "[T]$tag---$name---$value");
      }
    }
    return join('|||', @r);
  `);
  if (!raw) {
    throw Error('Engine is corrupted. Refreshing this page...');
  }

  const r = raw.split('|||');

  const {deletableGroups, writableTags} = await fetch('const.json').then(r => r.json());

  const groups = new Map();
  let tags;
  for (const line of r) {
    if (line.startsWith('[G]')) {
      tags = new Map();
      const group = line.slice(3);
      groups.set(group, {
        writable: deletableGroups.includes(group),
        tags
      });
    }
    else {
      const [tag, name, value] = line.slice(3).split('---');
      tags.set(tag, {
        name,
        value,
        writable: writableTags.includes(tag)
      });
    }
  }
  return groups;
}).catch(e => {
  exiftool.delete(file);
  throw e;
});

const insert = (file, groups) => {
  const ef = document.importNode(document.getElementById('file').content, true);
  ef.querySelector('h2').textContent = file.name;

  for (const [group, {writable, tags}] of groups.entries()) {
    if (group === 'ExifTool') {
      continue;
    }

    const eg = document.importNode(document.getElementById('group').content, true);
    eg.querySelector('summary').textContent = group + (writable ? '' : ' (readonly)');

    for (const [tag, {writable, name, value}] of tags.entries()) {
      // ignore the "FileSize", "FilePermissions" and "Directory" Tag of the "File" group
      if (['Directory', 'FileSize', 'FilePermissions'].includes(tag) && group === 'File') {
        continue;
      }

      const et = document.importNode(document.getElementById('tag').content, true);
      const [en, ev, ew] = et.querySelectorAll('span');
      en.textContent = name;
      en.classList.add('d1');
      ev.textContent = value;
      ev.classList.add('d2');
      ew.textContent = writable ? '' : '(readonly)';
      ew.classList.add('d3');
      et.querySelector('div').dataset.tag = tag;
      eg.querySelector('div').append(et);
    }
    ef.querySelector('.groups').append(eg);
  }
  document.getElementById('files').append(ef);
};

const next = async files => {
  document.getElementById('files').dataset.msg = 'Please wait while loading resources...';
  const v = await exiftool.upload(files).catch(e => e.message);
  if (v === true) {
    for (const file of files) {
      document.title = 'Working on ' + file.name;
      try {
        const meta = await explore(file);
        insert(file, meta);
      }
      catch (e) {
        console.error(e);
        const msg = `Cannot read meta information from "${file.name}" file.\n\n--\nError: ` + e.message;
        document.getElementById('files').dataset.msg = msg;

        const ef = document.importNode(document.getElementById('file').content, true);
        ef.querySelector('h2').textContent = file.name + ' (Failed)';
        const pre = document.createElement('pre');
        pre.textContent = msg;
        ef.querySelector('.groups').append(pre);
        document.getElementById('files').append(ef);


        // Engine is dead. Refresh the page
        if (e.message.includes('Perl exited with exit status')) {
          location.replace(location.href.split('?')[0]);
        }
      }
    }
    document.title = chrome.runtime.getManifest().name;
    await exiftool.umount();
  }
  else {
    const msg = 'Something went wrong\n\n--\nError: ' + v;
    document.getElementById('files').dataset.msg = msg;
  }
};

document.getElementById('input').onchange = e => {
  next(e.target.files);
};
document.addEventListener('click', e => {
  if (e.detail === 1) {
    return;
  }
  if (e.target.tagName === 'SUMMARY') {
    return;
  }
  document.getElementById('input').click();
});
document.ondragover = e => e.preventDefault();
document.ondrop = e => {
  e.preventDefault();
  const entries = [...e.dataTransfer.items].map(o => o.webkitGetAsEntry());
  const files = [];

  const dir = entry => {
    const reader = entry.createReader();
    return new Promise(resolve => reader.readEntries(resolve));
  };

  const add = async entries => {
    for (const entry of entries) {
      if (entry.isFile) {
        const file = await new Promise(resolve => {
          entry.file(resolve);
        });
        files.push(file);
      }
      else {
        return add(await dir(entry));
      }
    }
  };

  add(entries).then(() => next(files));
};

exiftool.ready().then(async () => {
  if (args.has('href')) {
    const files = args.getAll('href').map(href => {
      const name = href.split('/').pop() || (Math.random() + 1).toString(36).substring(7);
      return {
        name,
        type: 'remote',
        href
      };
    });
    next(files);
  }
  else {
    const version = await exiftool.execute('Image::ExifTool->VERSION');

    document.getElementById('files').dataset.msg =
      document.getElementById('files').dataset.msg.slice(0, -3) + 'Based on ExifTool v.' + version;
  }
});
