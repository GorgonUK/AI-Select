let selectedText = '';
let AISelect;
let overlay;
let conversations = {};
let loader;

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

// Load initial script state from chrome.storage
chrome.storage.sync.get('toggleSwitch', function (data) {
  if (data.toggleSwitch) {
    document.addEventListener('mouseup', handleTextSelection);
    console.log('Script Enabled');
  } else {
    document.removeEventListener('mouseup', handleTextSelection);
    console.log('Script Disabled');
  }
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



// Function to handle text selection
function handleTextSelection(event) {
  const selection = window.getSelection();

  selectedText = selection.toString().trim();

  if (AISelect) {
    AISelect.remove();
  }

  if (overlay) {
    overlay.remove();
  }

  if (selectedText) {

    const coords = getSelectionEndCoordinates();

    AISelect = document.createElement('a');
    AISelect.className = 'ai-select-popup-button ai-select-popup-button-text-white';
    AISelect.role = 'button';
    AISelect.style.backgroundColor = '#703FD5';
    AISelect.innerHTML = `<img class="ai-select-popup-button-image" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAH1UExURQAAAP7+///+//////j1/fv5/vr3/vj0/fr4/vz6/v39//79//v6/v38//z7/vXx/efa+fn2/e/m+/v4/ujb+f38/vn1/fXw/PXy/fn2/v7+//7+//////////////79///+//////////79///+//////7+//39//79//7+//////////////////////////////7+//7+//////////7+//79//////////////////////////38/v79//////////79//////////////7+//////7+//////////39//////7+//7+///////+//38//////////////79//7+///+//7+//7+//38//////////7+//79//////////79//7+///+//z6/v/+//7+//38//////////7+//7+//////////39//7+/////////+3i+v/+//////7+//38/v////////////////////////////7+///////////+//39//////////7+//////////7+//38/v/+//7+//////////7+//////79//7+///////+//z7/vTv/P/+//7+//7+///+//7+//////79//79//7+//7+//v5/v7+//7+//79//////79//79/////ylMfocAAACmdFJOUwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABkBiY10qZfPYLZf+UBIUNrrV2fnw1JUSSMvRWQsTLd+sFhQEEsbXHhnbpWD7dhoBEcMcW/pyD8D10hpYn41vDr3uOCfjzxhVoQSMagy57z4t5MwWUvehAYv9Zwu3iU1QTnvJTvb8YgmyxUrh618Jr1cdH0fqES7tsAcBmj0VQjHKIBtRMAEqUyK7BikCY7xaAAAAAWJLR0QDEQxM8gAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB+cFExYZG0QXSa0AAAHkSURBVEjH7ZTnU9RQFMX35ZBldx9Ze6+IK2Wx94qKRhEr9oa99y4qrL2Avffu+Tu9G0LZcZKXjw7D+fQyub85ufflnlisVz1MSlnwpYpsc31cDR8xcpSn0WNQbAYSGFtKX+PKVFBZMpHSqVQ7ML6jnpkJCKgvsVFeASctxz6orMpWTyQnZSdPmRrkAEybPmMm4nIsBmbNnjOXnDd/wUIVANh6UQ25eIlO5t36aiytJZcBKY0gg+WufPIK9POfV+aBuqAGxGBVfb7H7GpVEgkA1qz1prIO/aMAA5z1G8gGmf7GTV4XJgDYLFPcslXmvg0DzUBCb99B7ty1u5Hcs9ezCAeAfWKw/wAOisUhwAQk9eEj5NFjljp+gjx5StsGADh9hjx7Tv7m8+SFi3mLMCDtXLpMuleuNjVduy7kjQqtQwGF5ha5AdfN5XJuhszdFIsQIK5v3WaB7pTrdAhg4W6DzPSer/vi9UC6CQach4/I0ta2x57anjwl65/pEEA9f0G+fNWx9q/fkC1vVRjwrirT+B7+q0HWh+rMx09hAPD5y9dvenD705A0vv/4ia4FUv8wCShYunMRHVtJuXlFu2soKn+ZQ6DAM0rMFACRgqz73f/ujMo/KDIDMaW7wnhYhDDu1f+tvyyowXK0jKBxAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDIzLTA1LTE5VDIyOjI1OjE0KzAwOjAwViGkewAAACV0RVh0ZGF0ZTptb2RpZnkAMjAyMy0wNS0xOVQyMjoyNToxNCswMDowMCd8HMcAAAAodEVYdGRhdGU6dGltZXN0YW1wADIwMjMtMDUtMTlUMjI6MjU6MjcrMDA6MDDPDiBmAAAAAElFTkSuQmCC" alt="Icon">`;
    AISelect.style.position = 'absolute';
    AISelect.style.top = `${coords.y + 5}px`;
    AISelect.style.left = `${coords.x}px`;
    AISelect.style.zIndex = '9999';
    AISelect.style.textTransform = 'math-auto';
    AISelect.style.textDecoration = 'none';
    AISelect.style.fontWeight = 'bold';
    AISelect.style.fontSize = '18px';
    AISelect.style.fontFamily = 'roboto';
    AISelect.style.paddingTop = '0';
    AISelect.style.paddingBottom = '0px';
    AISelect.style.paddingRight = '8px';
    AISelect.style.paddingLeft = '8px';

    document.body.appendChild(AISelect);
    // Stop propagation of 'mouseup' event on button
    AISelect.addEventListener('mouseup', event => event.stopPropagation());

    // Add a slight delay to ensure the CSS transition plays
    setTimeout(() => {
      AISelect.classList.add('show');
    }, 50);

    // Pass the coordinates of the button to the click handler
    AISelect.addEventListener('click', () => handleAISelectClick(event.pageX + 20, event.pageY + 20));
  }
}

// Function to handle Ask GPT button click
async function handleAISelectClick(x, y) {
  AISelect.remove();

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
    AISelect.remove();
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

  chrome.storage.sync.get(['apiKey', 'selectedLanguage', 'customMessage'], async function (result) {
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

    async function main() {
      try {
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
    
        history.push({ role: 'user', content: selectedText });
    
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
    
            // create an audio element
            let audio = new Audio();
            audio.controls = true;
            audio.style.marginTop = '20px';
            contentDiv.appendChild(audio);
    
            if (result.selectedLanguage === "Estonian") {
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
    
    main();

  });


  body.className = 'ai-select-card-text'; // Added MDB classes
  body.style.color = 'rgb(44 34 34)';
  body.style.fontSize = 'inherit';
  body.style.float = 'left';
  body.style.fontSize = '18px';
  body.style.fontWeight = 'normal';
  body.style.fontFamily = 'roboto';

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



