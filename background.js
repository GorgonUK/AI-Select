/**
 * Listens for a message from the extension popup and sends a response with the current tab ID.
 * @param {Object} request - The message sent from the extension popup.
 * @param {Object} sender - The sender of the message.
 * @param {function} sendResponse - The function to send a response back to the extension popup.
 * @returns {boolean} - Returns true to indicate that a response will be sent asynchronously.
 */
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
  
  /**
   * Listens for changes in the Chrome storage and creates or removes the "Select AI" context menu
   * based on the value of the "toggleSwitch" key.
   * @param {Object} changes - An object containing the changes in the storage.
   * @param {string} namespace - The namespace of the storage.
   * @returns None
   */
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
  
  /**
   * Listens for a click event on the context menu and sends a message to the content script
   * with the selected text and event information.
   * @param {Object} info - Information about the context menu item that was clicked.
   * @param {Object} tab - The current tab object.
   * @returns None
   */
  chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId === "selectAIContext") {
      chrome.tabs.sendMessage(tab.id, {
        message: "selectAIContextItemClicked",
        data: info.selectionText,
        event: info
      });
    }
  });
  
  /**
   * Listener function that is called when the extension is installed.
   * Sets the default values for the extension's sync storage.
   * @returns None
   */
  chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.sync.set({ 
        toggleSwitch: false,  // Default value when installed
        selectedLanguage: 'English'  // Set default selected language as English
    });
});
  
  /**
   * Listens for updates to the tab and sends a message to the content script to toggle the script
   * based on the value of the toggle switch in the Chrome storage.
   * @param {number} tabId - The ID of the updated tab.
   * @param {object} changeInfo - An object containing information about the change to the tab.
   * @param {object} tab - The updated tab object.
   * @returns None
   */
  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
      chrome.storage.sync.get('toggleSwitch', function (data) {
        var enableScript = data.toggleSwitch;
        chrome.tabs.sendMessage(tabId, { toggleScript: true, enable: enableScript });
      });
    }
  });
  
  