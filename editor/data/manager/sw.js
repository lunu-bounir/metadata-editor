self.addEventListener('fetch', e => {
  const {url} = e.request;

  if (url.includes('/jslinux/disk/files/')) {
    e.respondWith(fetch(url).catch(() => {
      const segment = url.split('/files')[1];
      const href = 'https://vfsync.org/u/os/buildroot-x86-2/files/' + segment;
      console.info('segment not found', segment);
      return fetch(href);
    }));
  }
  else if (url.startsWith('https://')) {
    const {pathname} = new URL(url);
    e.respondWith(fetch('.' + pathname));
  }
  else {
    e.respondWith(fetch(e.request));
  }
});

// By default, a page's fetches won't go through a service worker
self.addEventListener('activate', () => self.clients.claim());
self.addEventListener('install', () => self.skipWaiting());
