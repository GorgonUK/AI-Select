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

  chrome.storage.sync.get('toggleSwitch', function (data) {
    if (data.toggleSwitch) {
      // If toggleSwitch is true, create the context menu item
      chrome.contextMenus.create({
        "id": "selectAIContext",
        "title": "Select AI",
        "contexts": ["selection"]
      });
    } else {
      // If toggleSwitch is false, remove the context menu item
      chrome.contextMenus.remove("selectAIContext");
    }
  });
  
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
      if (key === 'toggleSwitch') {
        if (newValue) {
          // If toggleSwitch changed to true, create the context menu item
          chrome.contextMenus.create({
            "id": "selectAIContext",
            "title": "Select AI",
            "contexts": ["selection"]
          });
        } else {
          // If toggleSwitch changed to false, remove the context menu item
          chrome.contextMenus.remove("selectAIContext");
        }
      }
    }
  });
  
  chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId === "selectAIContext") {
      chrome.tabs.sendMessage(tab.id, {
        message: "selectAIContextItemClicked",
        data: info.selectionText,
        event: info
      });
    }
  });
  

  //Turn on button
  chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.sync.set({ 
        toggleSwitch: false,  // Default value when installed
        selectedLanguage: 'English'  // Set default selected language as English
    });
});
  
  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
      chrome.storage.sync.get('toggleSwitch', function (data) {
        var enableScript = data.toggleSwitch;
        chrome.tabs.sendMessage(tabId, { toggleScript: true, enable: enableScript });
      });
    }
  });
  
  