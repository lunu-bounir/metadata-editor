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

const explore = (file, scan = 0) => exiftool.ready().then(async () => {
  const raw = await exiftool.execute(String.raw`
use strict;
use warnings;
use Image::ExifTool;
use JSON::PP;
use Scalar::Util qw(looks_like_number reftype);

my $exifTool = Image::ExifTool->new;

# Extremely conservative settings for WASM safety
$exifTool->Options(
    FastScan   => ${scan},          # 0→2 if crashes often
    Composite  => 1,
    MakerNotes => 0,
    PrintConv  => 1,
    Struct     => 0,
    Binary     => 0,
    Charset    => 'UTF8'
);

my $filename = "/work/${file.name}";

my %grouped;
my @errors;   # collect per-tag failures

eval {
    $exifTool->ExtractInfo($filename);
};
if ($@) {
    return JSON::PP->new->canonical(1)->ascii(1)->encode({
        error => "File metadata structure incompatible with WASM runtime: $@"
    });
}

my $info = $exifTool->GetInfo();

foreach my $tag (keys %$info) {
    my $val = $info->{$tag};

    if (ref($val)) {
        if (reftype($val) eq 'SCALAR') {
            # Keep as "SCALAR(0x...)" instead of dereferencing
            $val = "$val";
        } else {
            push @errors, {
                tag   => $tag,
                raw   => undef,
                error => "Unsupported complex reference type: " . ref($val),
            };
            next;
        }
    }

    my $safe_val;
    my $coerce_ok = 0;

    eval {
        if (defined $val) {
            if (looks_like_number($val)) {
                $safe_val = sprintf("%.10g", $val);
            } else {
                $safe_val = "" . $val;
            }
        } else {
            $safe_val = "";
        }
        $coerce_ok = 1;
    };

    if ($coerce_ok) {
        my $group    = $exifTool->GetGroup($tag, 1) || 'Unknown';
        my $label    = $exifTool->GetDescription($tag) || $tag;
        my $instance = $exifTool->GetGroup($tag, 4) || '';

        if ($instance =~ /^Copy(\d+)$/) {
            $instance = $1;
        }
        $label .= " ($instance)" if $instance ne '';

        $grouped{$group}{$tag} = {
            label => $label,
            value => $safe_val,
        };
    } else {
        push @errors, {
            tag   => $tag,
            raw   => defined $val ? "$val" : undef,
            error => "$@",
        };
    }
}

my %result = %grouped;
$result{errors} = \@errors if @errors;

return JSON::PP->new->canonical(1)->ascii(1)->encode(\%result);
  `);

  if (!raw) {
    throw Error('Engine is corrupted. Refreshing this page...');
  }

  console.info(JSON.parse(raw));

  return JSON.parse(raw);
}).catch(e => {
  exiftool.delete(file);
  throw e;
});

const insert = async (file, groups) => {
  const ef = document.importNode(document.getElementById('file').content, true);
  ef.querySelector('h2').textContent = file.name;

  const {deletableGroups, writableTags} = await fetch('const.json').then(r => r.json());


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
      ew.textContent = writableTags.includes(tag) ? '' : '(readonly)';
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

  for (const file of files) {
    try {
      // in case of error, increase the fast scan value
      for (let scan = 0; ; scan += 1) {
        try {
          const v = await exiftool.upload([file]).catch(e => e.message);
          if (v !== true) {
            const msg = 'Something went wrong\n\n--\nError: ' + v;
            document.getElementById('files').dataset.msg = msg;
            return;
          }

          document.title = 'Working on ' + file.name;
          const meta = await explore(file, scan);
          // add FastScan value to metadata
          if ('System' in meta) {
            meta['System']['FastScan'] = {
              label: 'Fast Scan',
              value: scan
            };
          }
          insert(file, meta);
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
