/* global os, display */

const status = document.getElementById('status');
const files = document.getElementById('files');

const stats = {
  total: 0,
  current: 0,
  update() {
    files.textContent = stats.total ? '[' + stats.current + '/' + stats.total + ']' : '';
  }
};

const proceed = (files = []) => {
  proceed.files.push(...files);
  stats.total += files.length;
  stats.update();

  if (proceed.busy) {
    return;
  }

  const file = proceed.files.shift();
  if (file) {
    stats.current += 1;
    stats.update();

    proceed.busy = true;
    status.textContent = 'processing';
    status.classList.add('blink');
    (new Response(file)).arrayBuffer().then(async buffer => {
      await os.disk({
        command: 'write',
        buffer,
        name: 'input'
      });
      const can = await os.run(`nice -20 perl can-write.pl "${file.name}"`);

      const {stdout} = await os.run('nice -20 perl read-tags.pl');

      const r = new Map();
      const o = stdout.slice(stdout.indexOf('tag: ')).split('|||');
      o.pop();

      for (let n = 0; n < o.length; n += 4) {
        r.set(o[n].slice(5), {
          value: o[n + 1],
          groups: o[n + 2]?.split(',') || [],
          writable: o[n + 3] === '1'
        });
      }
      r.delete('FileName');
      r.delete('FilePermissions');
      r.delete('Directory');
      r.delete('ExifToolVersion');
      console.log(can);
      display(file, r, can.stdout.endsWith('1\r\n'));

      await os.run('rm input');

      proceed.busy = false;
      status.classList.remove('blink');
      status.textContent = 'ready';
      setTimeout(proceed, 1000);
    });
  }
  else {
    files.textContent = '';
    save();
  }
};
proceed.files = [];
proceed.busy = true;

const save = o => { // {target, file, tags}
  if (o) {
    save.jobs.push(o);
    o.target.value = 'Saving...';
    o.target.disabled = true;
  }

  if (os.busy) {
    return;
  }

  const job = save.jobs.shift();

  if (job) {
    status.textContent = 'processing';
    status.classList.add('blink');
    (new Response(job.file)).arrayBuffer().then(async buffer => {
      await os.disk({
        command: 'write',
        buffer,
        name: 'input'
      });
      const {stdout} = await os.run('nice -20 perl remove-tags.pl ' + [...job.tags].map(s => `"${s}"`).join(' '));
      console.log(stdout);

      const n = stdout.indexOf('[error]');
      if (n !== -1) {
        const msg = stdout.slice(n + 3);
        if (msg) {
          alert(msg);
        }
        else {
          console.warn('File might have been broken', stdout);
        }
      }

      const name = job.file.name;
      await os.run(`rm input && mv output "/tmp/${name}" && export_file "/tmp/${name}" && rm "/tmp/${name}"`);

      status.classList.remove('blink');
      status.textContent = 'ready';
      job.target.value = 'Save';
      job.target.disabled = false;
      proceed();
    });
  }
};
save.jobs = [];

document.addEventListener('booted', async () => {
  status.textContent = 'running';

  await os.run('rm hello.* && rm -r dos');
  await os.disk({
    href: 'ExifTool/disk.ext2',
    name: 'disk.ext2'
  });
  status.textContent = 'mounting';
  await os.run('mkdir ExifTool && mount disk.ext2 ExifTool/');
  await os.disk({
    href: 'perl/read-tags.pl',
    name: 'read-tags.pl'
  });
  await os.disk({
    href: 'perl/remove-tags.pl',
    name: 'remove-tags.pl'
  });
  await os.disk({
    href: 'perl/can-write.pl',
    name: 'can-write.pl'
  });
  status.textContent = 'ready';
  proceed.busy = false;

  proceed();
}, {
  once: true
});

