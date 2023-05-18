chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.message === "getTabId") {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          sendResponse({tabId: tabs[0].id});
        });
        return true;
      }
    }
  );

  //Turn on button
  chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.sync.set({ toggleSwitch: false }); // Default value when installed
  });
  
  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
      chrome.storage.sync.get('toggleSwitch', function (data) {
        var enableScript = data.toggleSwitch;
        chrome.tabs.sendMessage(tabId, { toggleScript: true, enable: enableScript });
      });
    }
  });
  
  