document.getElementById('file').onchange = e => {
  worker.postMessage({
    cmd: 'execute',
    file: e.target.files[0],
    program: {
      name: 'run.pl',
      code: `#!/usr/bin/perl

# Print a string
my $message = "Hello, Perl!";
print $message, "\n";`
    }
  });
};

const worker = new Worker('worker.js');
worker.onmessage = e => {
  const request = e.data;

  if (request.cmd === 'ready') {
    document.getElementById('file').disabled = false;
  }
  else if (request.cmd === 'stdout') {
    console.info(request.stdout);
  }
  else if (request.cmd === 'stderr') {
    console.error(request.stderr);
  }
};
