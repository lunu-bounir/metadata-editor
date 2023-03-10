chrome.action.onClicked.addListener(async tab => {
  const tabs = await chrome.tabs.query({
    url: chrome.runtime.getURL('/data/manager/*')
  });

  if (tabs.length) {
    chrome.windows.update(tabs[0].windowId, {
      focused: true
    });
    chrome.tabs.update(tabs[0].id, {
      active: true
    });
  }
  else {
    chrome.tabs.create({
      url: '/data/manager/index.html',
      index: tab.index + 1
    });
  }
});
