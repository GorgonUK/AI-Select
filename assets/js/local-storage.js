// Function to handle the "Save Settings" button click event
function saveSettings() {
    var languageSelect = document.getElementById("language-select");
    var apiKeyInput = document.getElementById("apiKeyInput");
    var leadingPromptInput = document.getElementById("leadingPromptInput");

    var languageValue = languageSelect.options[languageSelect.selectedIndex].text;
    var apiKeyValue = apiKeyInput.value;
    var leadingPromptValue = leadingPromptInput.value;

    // Save the values in the chrome.storage
    chrome.storage.sync.set({
        "selectedLanguage": languageValue,
        "apiKey": apiKeyValue,
        "leadingPrompt": leadingPromptValue
    }, function() {
        alert("Settings saved successfully!");
    });
}

var saveSettingsButton = document.getElementById("saveSettingsButton");
saveSettingsButton.addEventListener("click", saveSettings);

// Retrieve and display the saved values from the chrome.storage when the page loads
window.addEventListener("load", function () {
    var languageSelect = document.getElementById("language-select");
    var apiKeyInput = document.getElementById("apiKeyInput");
    var leadingPromptInput = document.getElementById("leadingPromptInput");

    // Get the values from the chrome.storage
    chrome.storage.sync.get(["selectedLanguage", "apiKey", "leadingPrompt"], function(items) {
        // Set the values in the form fields
        languageSelect.value = items.selectedLanguage || '';
        apiKeyInput.value = items.apiKey || '';
        leadingPromptInput.value = items.leadingPrompt || '';

        // Add "active" class to elements
        languageSelect.classList.add("active");
        apiKeyInput.classList.add("active");
        leadingPromptInput.classList.add("active");
    });
});
