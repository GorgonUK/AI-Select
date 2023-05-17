chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.message === "getTabId") {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          sendResponse({tabId: tabs[0].id});
        });
        return true;  // Will respond asynchronously.
      }
    }
  );
  