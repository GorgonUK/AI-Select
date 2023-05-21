//Clear Chat history
function clearHistory() {
  // Get all keys from the local storage
  const keys = Object.keys(localStorage);

  // Iterate over the keys
  for (let key of keys) {
    // If the key starts with 'history_', remove it
    if (key.startsWith("history_")) {
      localStorage.removeItem(key);
    }
  }
}
// Function to handle the "Save Settings" button click event
function saveSettings() {
  var languageSelect = document.getElementById("language-select");
  var apiKeyInput = document.getElementById("apiKeyInput");
  var toggleSwitch = document.getElementById("select-ai-switch");

  var languageValue = languageSelect.options[languageSelect.selectedIndex].text;
  var apiKeyValue = apiKeyInput.value;
  var toggleSwitchValue = toggleSwitch.checked;

  clearHistory();

  // Save the values in the chrome.storage
  chrome.storage.sync.set(
    {
      selectedLanguage: languageValue,
      apiKey: apiKeyValue,
      toggleSwitch: toggleSwitchValue,
    },
    function () {
      console.log("Settings saved")
    }
  );
  
}

// Retrieve and display the saved values from the chrome.storage when the page loads
window.addEventListener("load", function () {
  var languageSelect = document.getElementById("language-select");
  var apiKeyInput = document.getElementById("apiKeyInput");
  var toggleSwitch = document.getElementById("select-ai-switch");
  var saveSettingsButton = document.getElementById("saveSettingsButton");

  // Function to check if all required fields have information
  function checkFields() {
    var languageValue = languageSelect.value;
    var apiKeyValue = apiKeyInput.value;

    // Enable or disable the save settings button based on field values
    if (apiKeyValue) {
      saveSettingsButton.disabled = false;
      toggleSwitch.removeAttribute("disabled");
    } else {
      saveSettingsButton.disabled = true;
      toggleSwitch.setAttribute("disabled", "disabled");
    }
  }

  // Add input event listeners to check if all required fields have information
  languageSelect.addEventListener("input", checkFields);
  apiKeyInput.addEventListener("input", checkFields);

  // Add "change" event listener to the toggle switch
  toggleSwitch.addEventListener("change", function (e) {
    var checked = e.target.checked;
    chrome.storage.sync.set({ toggleSwitch: checked });
  });

  // Add click event listener to the save settings button
  saveSettingsButton.addEventListener("click", saveSettings);

  // Get the values from the chrome.storage
  chrome.storage.sync.get(
    ["selectedLanguage", "apiKey", "toggleSwitch"],
    function (items) {
      // Set the values in the form fields
      languageSelect.value = items.selectedLanguage || "";
      apiKeyInput.value = items.apiKey || "";
      toggleSwitch.checked = items.toggleSwitch || false;

      // Add "active" class to elements
      languageSelect.classList.add("active");
      apiKeyInput.classList.add("active");

      // Check fields on page load
      checkFields();
    }
  );
});
