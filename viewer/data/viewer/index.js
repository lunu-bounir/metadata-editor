/* global ExifTool */

// exiftool -listw && exiftool -listd

const exiftool = new ExifTool();
exiftool.ready().then(async () => {
  const version = await exiftool.execute('Image::ExifTool->VERSION');

  document.getElementById('files').dataset.msg =
    document.getElementById('files').dataset.msg.slice(0, -3) + 'Based on ExifTool v.' + version;
});

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
  console.error(e);
  exiftool.delete(file);
  alert(`The "${file.name}" file is not supported.\n\n--\n` + e.message);
  location.reload();
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
      ev.textContent = value;
      ew.textContent = writable ? '' : '(readonly)';
      et.querySelector('div').dataset.tag = tag;
      eg.querySelector('div').append(et);
    }
    ef.querySelector('.groups').append(eg);
  }
  document.getElementById('files').append(ef);
};

const next = async files => {
  document.getElementById('files').dataset.msg = 'Please wait while loading resources...';

  await exiftool.upload(files);
  for (const file of files) {
    const meta = await explore(file);
    insert(file, meta);
  }
  await exiftool.umount();
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
  next(e.dataTransfer.files);
};
