const open = async (tab, href) => {
  const tabs = await chrome.tabs.query({
    url: chrome.runtime.getURL('/data/viewer/*')
  });

  if (tabs.length) {
    chrome.windows.update(tabs[0].windowId, {
      focused: true
    });
    chrome.tabs.update(tabs[0].id, {
      active: true
    });
    if (href) {
      chrome.runtime.sendMessage({
        method: 'open',
        href
      });
    }
  }
  else {
    const args = new URLSearchParams();
    if (href) {
      args.set('href', href);
    }

    chrome.tabs.create({
      url: '/data/viewer/index.html?' + args.toString(),
      index: tab.index + 1
    });
  }
};

chrome.action.onClicked.addListener(tab => {
  open(tab);
});

chrome.storage.onChanged.addListener(ps => {
  if ('image-context-menu' in ps) {
    build();
  }
});
const onClicked = (info, tab) => {
  if (info.menuItemId === 'inspect') {
    open(tab, info.srcUrl);
  }
};
const build = () => chrome.storage.local.get({
  'image-context-menu': false
}, prefs => {
  if (prefs['image-context-menu']) {
    chrome.contextMenus.create({
      title: 'Inspect Metadata',
      id: 'inspect',
      contexts: ['image']
    }, () => chrome.runtime.lastError);
    chrome.contextMenus.onClicked.addListener(onClicked);
  }
  else if (chrome.contextMenus) {
    chrome.contextMenus.remove('inspect');
    chrome.contextMenus.onClicked.removeListener(onClicked);
  }
});
chrome.runtime.onStartup.addListener(build);
chrome.runtime.onInstalled.addListener(build);

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const page = getManifest().homepage_url;
    const {name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.query({active: true, currentWindow: true}, tbs => tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install',
              ...(tbs && tbs.length && {index: tbs[0].index + 1})
            }));
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
