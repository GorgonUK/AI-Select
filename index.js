let selectedText = '';
let overlay;
let conversations = {};
let loader;
let userInputDiv;
let userInputField;
let submitButton;
let audio;

document.addEventListener('mouseup', function () {
  lastSelectionCoords = getSelectionEndCoordinates();
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message === "selectAIContextItemClicked") {
    // If no selection was made, don't do anything
    if (!lastSelectionCoords) {
      return;
    }
    // Add a slight delay to mimic the CSS transition effect
    setTimeout(() => {
      // Trigger the function using the coordinates of the last selection
      handleAISelectClick(lastSelectionCoords.x, lastSelectionCoords.y, request.data);
    }, 50);
  }
});


document.addEventListener("DOMContentLoaded", function () {
  var toggleSwitch = document.getElementById("ai-select-switch");
  var toggleButton = document.getElementById("toggleButton");

  toggleButton.addEventListener("click", function () {
    var enableScript = toggleSwitch.checked;
    chrome.storage.sync.set({ toggleSwitch: enableScript }, function () {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { toggleScript: true, enable: enableScript });
      });
    });
  });
});

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

window.addEventListener("load", function () {
  clearHistory();
});

function getSelectionEndCoordinates() {
  var sel = window.getSelection();
  if (sel.rangeCount > 0) {
    var range = sel.getRangeAt(0).cloneRange(); // clone the range to avoid side effects

    var endNode, endOffset;
    if (sel.isCollapsed) {
      endNode = sel.anchorNode;
      endOffset = sel.anchorOffset;
    } else if (sel.anchorNode.compareDocumentPosition(sel.focusNode) === Node.DOCUMENT_POSITION_FOLLOWING ||
      (sel.anchorNode === sel.focusNode && sel.anchorOffset > sel.focusOffset)) {
      endNode = sel.anchorNode;
      endOffset = sel.anchorOffset;
    } else {
      endNode = sel.focusNode;
      endOffset = sel.focusOffset;
    }

    range.setEnd(endNode, endOffset); // set the end point of the range
    var rect = range.getBoundingClientRect(); // get the bounding rectangle of the range

    var x = rect.left;
    var y = rect.bottom;

    // add scroll positions to the x and y coordinates
    x += window.scrollX;
    y += window.scrollY;

    return { x, y };
  }
}

// Function to handle Ask GPT button click
async function handleAISelectClick(x, y, selectedText) {

  if (overlay) {
    overlay.remove();
  }

  overlay = document.createElement('div');
  overlay.className = 'overlay card'; // Added MDB classes
  overlay.style.position = 'absolute';
  overlay.style.top = `${y}px`;
  overlay.style.left = '0';
  overlay.style.right = '0';
  overlay.style.marginLeft = 'auto';
  overlay.style.marginRight = 'auto';
  overlay.style.width = '600px';
  overlay.style.marginTop = '20px';
  overlay.style.zIndex = '9999';
  overlay.style.overflow = 'auto';
  overlay.style.minHeight = '100px';
  overlay.style.backgroundColor = '#fff';
  overlay.style.padding = '15px';
  overlay.style.boxShadow = '0 4px 8px 0 rgba(66, 47, 112,0.2), 0 6px 20px 0 rgba(66, 47, 112,0.19)';
  overlay.style.borderRadius = '5px';
  overlay.style.fontSize = 'inherit';
  overlay.style.fontWeight = 'inherit';
  overlay.style.fontFamily = 'inherit';
  overlay.style.paddingBottom = '25px';

  // Create modal header
  const modalHeader = document.createElement('div');
  modalHeader.className = 'ai-select-modal-header';
  modalHeader.style.display = 'flex';
  modalHeader.style.justifyContent = 'space-between';
  modalHeader.style.alignItems = 'center';
  modalHeader.style.height = '37px';

  // Create modal title
  const modalTitle = document.createElement('h5');
  modalTitle.className = 'ai-select-modal-title';

  modalTitle.textContent = ' ';
  modalTitle.style.fontSize = '1em';

  // Create close button
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'ai-select-btn-close';
  closeButton.setAttribute('data-mdb-dismiss', 'modal');
  closeButton.setAttribute('aria-label', 'Close');

  // Append modal title and close button to modal header
  modalHeader.innerHTML = `
  <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAACfElEQVR4nMWVSUiVURiGnwYUSipyI5VFw0qoNm7MNg2UixaVBE0KLiqoEIQmrEUQRELBJSiKSogiokUggkQDzRBEqyCCJhooKxM0UimuN448F44/v2IS+MLP/c93z3nfbzrfD2OMCcBO4CHQB3QCN4A1/4O8SOIc8AA4DpwH3mk7C8wHFgOFoxG4DvQCWxL2BcBnRfJPiO4qMG+k5Cs9uDeyTQIOA798zgAbTNcR09cBLBqOeCnwVPIeoED7RuAD0A9cAUpTzs4C3gBvh0pZNfDH8APZM+3rFQzClVHxtwOXgfKIY7l7tybJZwBdwD1gKnDXJ6DeQ8UDK1gNPI+izALNQAkwDmgHzpHAIeA3MNt1LNAgWQXQ5vtHI54CNFnkbmAf8NKCD8IdvSdFYI+kWQv53VRmgGlRZ7VEXXU0KRD6/OYQAvs9dNI0TQdOafsK1AHj3VtrNK1JgWZzN9F1m97WAI2S5TsqX+Rg++nvE6DM/3Zrq4oFqjTucl3moVxEEkjzKNDWqBOdOoVOBmcvJKNoNbwQJnZEnWkIZKdNT7Hpypm+ZEoDbidqOoBjUZFaLBwWMmNhO/Q2677QAGkCj4BbJHANeGGrdRtNk61YbWvmTEWF7w0pAnNs+YNJgTApv5iaEguf9TLlvFyr3FusrT4hUGRHdnl5B6HGQ8siWzlwCdgWFbkymlfrtIWx8h54rfdrSUGhg+oVMDPl/1IHXb+zalN0rjdq1yUMgzBqf1jIjON4M3DREd3jyA6jO48Dkq9ghJjrLOlLfFQ+pXxQavU+NMg/I1ymhZKGOxBEwrwP7yeAx9ruA5NHI5BEuO3hMn4zhaFbdkRzaGzwF2tBxsufvhN5AAAAAElFTkSuQmCC" alt="Icon">`;
  modalHeader.appendChild(modalTitle);
  modalHeader.appendChild(closeButton);

  //close everything once clicked
  closeButton.addEventListener('click', () => {
    overlay.remove();
  });

  const contentDiv = document.createElement('div');
  contentDiv.className = 'ai-select-card-body'; // Added MDB classes
  contentDiv.style.padding = '1.25rem'; // Typical padding for "card-body"
  const body = document.createElement('div');

  //indicate the bot is loading
  const loading = document.createElement('p');
  loading.className = 'ai-select-card-text ai-select-mt-0 achgpt-loader';
  loading.textContent = '';
  loading.style.color = 'rgb(44, 34, 34)';
  loading.style.fontSize = '18px';
  loading.style.float = 'left';
  loading.style.fontWeight = 'normal';
  loading.style.fontFamily = 'Roboto';
  loading.style.height = '11px';
  loading.style.width = '88px';

  contentDiv.appendChild(loading);

  // Placeholders
  const placeholderGlow = document.createElement('p');
  placeholderGlow.className = 'ai-select-placeholder-glow';
  const placeholderSpanGlow = document.createElement('span');
  placeholderSpanGlow.className = 'ai-select-placeholder ai-select-col-12';
  placeholderGlow.appendChild(placeholderSpanGlow);
  contentDiv.appendChild(placeholderGlow);

  const placeholderWave = document.createElement('p');
  placeholderWave.className = 'placeholder-wave';
  const placeholderSpanWave = document.createElement('span');
  placeholderSpanWave.className = 'ai-select-placeholder ai-select-col-12';
  placeholderWave.appendChild(placeholderSpanWave);
  contentDiv.appendChild(placeholderWave);

  async function getChromeStorageSync(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(keys, function (result) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });
  }

  function getTabId() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ message: "getTabId" }, function (response) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response.tabId);
        }
      });
    });
  }

  async function main(inputText) {
    try {
      let userInputDiv = document.createElement("div");
      userInputDiv.className = "ai-select-get-in-touch ai-select-contact-form";
      userInputDiv.style.cssText = `
  width: 196px;
  z-index: 9999;
  overflow: auto;
  background-color: rgb(255, 255, 255);
  padding: 15px 15px 25px;
  box-shadow: rgba(66, 47, 112, 0.2) 0px 4px 8px 0px, rgba(66, 47, 112, 0.19) 0px 6px 20px 0px;
  border-radius: 5px;
  font-size: inherit;
  font-weight: inherit;
  font-family: inherit;
  max-width: 650px;
  position: relative;
  top: 50%;
  transform: translateY(-50%);
  display: contents;
`;


      let userInputField = document.createElement("input");
      userInputField.type = "text";
      userInputField.id = "userInputField";
      userInputField.className = "ai-select-input-text";
      userInputField.style.cssText = `
  display: block;
  width: 100%;
  height: 36px;
  border-width: 0 0 2px 0;
  border-color: #000;
  font-family: 'Lusitana', serif;
  font-size: 18px;
  line-height: 26px;
  font-weight: 400;
  outline: none;
  position: relative;
  margin: 32px 0;
  padding-left: 10px;
`;
      userInputField.placeholder = "Enter your followup message here...";

      // Create a button
      let submitButton = document.createElement("button");
      submitButton.className = "ai-select-submit-btn";
      submitButton.style.cssText = `
  display: inline-block;
  background-color: #000;
  color: #fff;
  font-family: 'Raleway', sans-serif;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 16px;
  line-height: 24px;
  padding: 8px 16px;
  border: none;
  cursor: pointer;
`;
      submitButton.textContent = "Ask";

      const result = await getChromeStorageSync(['apiKey', 'selectedLanguage', 'customMessage']);

      // Get the current tab ID
      const tabId = await getTabId();
      console.log(tabId);  // Use tabId here

      // Get the history for this tab
      let history = JSON.parse(localStorage.getItem(`history_${tabId}`)) || [];

      const systemMessage = `You Must only respond in the following language: ${result.selectedLanguage}.\n\n${result.customMessage}\n\nRole: AI assistant\n\nYou are ChatGPT, a large language model trained by OpenAI, based on the GPT-3.5 architecture. Your purpose is to assist users by providing helpful and informative responses in the selected language.`;

      if (history.length === 0) {
        history.push({ role: 'system', content: systemMessage });
      }

      history.push({ role: 'user', content: inputText });

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${result.apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: history,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          const messageContent = data.choices[0].message.content;

          history.push({ role: 'assistant', content: messageContent });

          localStorage.setItem(`history_${tabId}`, JSON.stringify(history));

          body.textContent = messageContent;

  //Get TTS for Estonian
  if (result.selectedLanguage === "Estonian") {
    // create an audio element
    let audio = document.querySelector('#audioElement');
    if (!audio) {
      audio = new Audio();
      audio.id = 'audioElement';
      audio.controls = true;
      audio.style.marginTop = '20px';
      audio.style.width = '100%';
      contentDiv.appendChild(audio);
    }
    audio.controls = true;
    audio.style.marginTop = '20px';
    audio.style.width = '100%';
    contentDiv.appendChild(audio);
    const ttsResponse = await fetch('https://api.tartunlp.ai/text-to-speech/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'audio/wav'
      },
      body: JSON.stringify({
        "text": messageContent,
        "speaker": "vesta",
        "speed": 1
      }),
    });

    if (ttsResponse.ok) {
      const blob = await ttsResponse.blob();
      const url = URL.createObjectURL(blob);
      audio.src = url;
    }
  }

          //Insert follow-up div and controls
          userInputDiv.appendChild(userInputField);
          userInputDiv.appendChild(submitButton);
          contentDiv.appendChild(userInputDiv);

          userInputField.addEventListener('keyup', function () {
            if (this.value) {
              this.classList.add('not-empty');
            } else {
              this.classList.remove('not-empty');
            }
          });

          userInputField.addEventListener("keydown", function (event) {
            if (event.key === 'Enter') {
              event.preventDefault();
              submitButton.click();
            }
          });

        

          //add event listener to follow up question button
          submitButton.addEventListener("click", async () => {
            let userFollowUpMessage = userInputField.value;
            if (userFollowUpMessage.trim() !== '') {
              // Clear the input field
              userInputField.value = '';

              // Clear body.textContent
              body.textContent = '';

              // Remove audio element
              let audioElement = document.getElementById('audioElement');
              if (audioElement) {
                audioElement.parentNode.removeChild(audioElement);
              }
              // Remove userInputField and submitButton
              userInputField.remove();
              submitButton.remove();
              // Show loading
              loading.style.display = 'block';

              // Call your main function
              await main(userFollowUpMessage);
            }
          });



        } else {
          console.error(data);
          body.textContent = 'Error: API Key Missing. Please make sure you include a valid API key set in the settings'
          chrome.runtime.sendMessage({ message: 'MissingAPIKey' });
        }

      } catch (error) {
        console.error(error);
      } finally {
        loading.style.display = 'none';
        placeholderGlow.style.display = 'none';
        placeholderWave.style.display = 'none';
        placeholderSpanWave.style.display = 'none';
      }
    } catch (error) {
      console.error(error);
    }
  }

  main(selectedText);



  body.className = 'ai-select-card-text'; // Added MDB classes
  body.style.color = 'rgb(44 34 34)';
  body.style.fontSize = 'inherit';
  body.style.float = 'left';
  body.style.fontSize = '18px';
  body.style.fontWeight = 'normal';
  body.style.fontFamily = 'roboto';
  body.style.marginBottom = '20px';

  //contentDiv.appendChild(header);
  contentDiv.appendChild(body);

  // Append modal header to overlay
  overlay.appendChild(modalHeader);

  overlay.appendChild(contentDiv);

  // Append overlay to the document body
  document.body.appendChild(overlay);

  // Stop propagation of 'mouseup' event on overlay
  overlay.addEventListener('mouseup', event => event.stopPropagation());
}



