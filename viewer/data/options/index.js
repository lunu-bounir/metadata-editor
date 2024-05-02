const icm = document.getElementById('image-context-menu');
const toast = document.getElementById('toast');

chrome.storage.local.get({
  'image-context-menu': false
}, prefs => {
  icm.checked = prefs['image-context-menu'];
});

icm.onchange = e => {
  if (e.target.checked) {
    chrome.permissions.request({
      permissions: ['contextMenus'],
      origins: ['*://*/*']
    }, granted => {
      if (!granted) {
        icm.checked = false;
      }
    });
  }
};

let id;
const notify = message => {
  toast.textContent = 'Options saved';
  clearTimeout(id);
  id = setTimeout(() => {
    toast.textContent = '';
  }, 750);
};

document.getElementById('save').onclick = e => chrome.storage.local.set({
  'image-context-menu': icm.checked
}, () => {
  if (icm.checked === false) {
    // wait for context menu to get removed
    setTimeout(() => {
      chrome.permissions.remove({
        permissions: ['contextMenus'],
        origins: ['*://*/*']
      }, () => notify('Options saved'));
    }, 1000);
  }
  else {
    notify('Options saved');
  }
});

document.getElementById('reset').onclick = e => {
  if (e.detail === 1) {
    notify('Double-click to reset!');
  }
  else {
    localStorage.clear();
    chrome.storage.local.clear(() => {
      chrome.runtime.reload();
      window.close();
    });
  }
};

document.getElementById('support').onclick = () => chrome.tabs.create({
  url: chrome.runtime.getManifest().homepage_url + '&rd=donate'
});
