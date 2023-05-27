// define a global map for global data
window.SelectAIGlobals = window.SelectAIGlobals || {};
let selectedText = '';
let overlay;
let conversations = {};
let loader;
let userInputDiv;
let userInputField;
let submitButton;
let audio;
let lastSelectionCoords = null;
let history = [];

/*
Element Styles
*/

// Styles for modal header
const modalHeaderStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  height: '37px',
  cursor: 'move'
};

// Styles for modal title
const modalTitleStyles = {
  fontSize: '1em',
  marginLeft: '12px'
};

// Styles for close button
const closeButtonStyles = {
  padding: 'calc(1rem*0.5) calc(1rem*0.5)',
  margin: 'calc(1rem*-0.5) calc(1rem*-0.5) calc(1rem*-0.5) auto',
  marginRight: '4px',
  webkitAppearance: 'button',
  boxSizing: 'content-box',
  width: '1em',
  height: '1em',
  color: 'rgb(0, 0, 0)',
  opacity: '0.5',
  background: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0 111.414 1.414L9.414 8l6.293 6.293a1 1 0 01-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 01-1.414-1.414L6.586 8 .293 1.707a1 1 0 010-1.414z\'/%3E%3C/svg%3E") 50% center / 1em no-repeat transparent',
  borderWidth: '0px',
  borderStyle: 'initial',
  borderColor: 'initial',
  borderImage: 'initial',
  borderRadius: '0.25rem',
  cursor: 'pointer'
};

const loadingStyles = {
  color: 'rgb(44, 34, 34)',
  fontSize: '18px',
  float: 'left',
  fontWeight: 'normal',
  fontFamily: 'Roboto',
  height: '9px',
  width: '84px',
  webkitMask: 'radial-gradient(circle closest-side, #000000 94%, #0000) left/20% 100%',
  background: 'linear-gradient(#000000 0 0) left/0% 100% no-repeat #E4E4ED',
  animation: 'p7 2.5s infinite steps(6)'
};

const userInputDivStyles = {
  width: '196px',
  zIndex: '9999',
  overflow: 'auto',
  backgroundColor: 'rgb(255, 255, 255)',
  padding: '15px 15px 25px',
  boxShadow: 'rgba(66, 47, 112, 0.2) 0px 4px 8px 0px, rgba(66, 47, 112, 0.19) 0px 6px 20px 0px',
  borderRadius: '5px',
  fontSize: 'inherit',
  fontWeight: 'inherit',
  fontFamily: 'inherit',
  maxWidth: '650px',
  position: 'relative',
  top: '50%',
  transform: 'translateY(-50%)',
  display: 'contents'
};

const userInputFieldStyles = {
  display: 'block',
  width: '100%',
  height: '36px',
  borderWidth: '0 0 2px 0',
  borderColor: '#000',
  fontFamily: "'Lusitana', serif",
  fontSize: '18px',
  lineHeight: '26px',
  fontWeight: '400',
  outline: 'none',
  position: 'relative',
  margin: '7px 0px 32px 0px',
  paddingLeft: '10px'
};

const submitButtonStyles = {
  display: 'inline-block',
  backgroundColor: '#000',
  color: '#fff',
  fontFamily: "'Raleway', sans-serif",
  textTransform: 'uppercase',
  letterSpacing: '2px',
  fontSize: '16px',
  lineHeight: '24px',
  padding: '8px 16px',
  border: 'none',
  cursor: 'pointer'
};

/**
 * Adds an event listener to the DOMContentLoaded event and sets up a click event listener
 * for the toggle button. When the toggle button is clicked, it updates the state of the
 * toggle switch and sends a message to the active tab to toggle the script on or off.
 */
document.addEventListener("DOMContentLoaded", function () {
  var toggleSwitch = document.getElementById("select-ai-switch");
  var toggleButton = document.getElementById("toggleButton");

  toggleButton.addEventListener("click", function () {
    var enableScript = toggleSwitch.checked;
    chrome.storage.sync.set({
      toggleSwitch: enableScript
    }, function () {
      chrome.tabs.query({
        active: true,
        currentWindow: true
      }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          toggleScript: true,
          enable: enableScript
        });
      });
    });
  });
});

/**
 * Clears the browsing history stored in localStorage by removing all keys that start with "history_".
 */
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

/**
 * Adds an event listener to the window object that listens for the "load" event.
 * When the event is triggered, the clearHistory function is called.
 */
window.addEventListener("load", function () {
  clearHistory();
});

/**
 * Gets the coordinates of the end of the current selection in the window.
 * @returns An object containing the x and y coordinates of the end of the selection.
 */

/**
 * Listens for a message from the extension popup indicating that the "select AI context" item has been clicked.
 * If the message is received, retrieves the coordinates of the last selection and passes them to the handleSelectAIClick function.
 * @param {Object} request - The message received from the extension popup.
 * @param {Object} sender - The sender of the message.
 * @param {function} sendResponse - The function to send a response back to the sender.
 * @returns None
 */
let clickCoords = {};

window.addEventListener('contextmenu', function (event) {
  clickCoords = { x: event.clientX, y: event.clientY + window.scrollY };
});


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message === 'getClickCoords') {
    sendResponse(clickCoords);
  } else if (request.message === "selectAIContextItemClicked") {
    // Check if x and y coordinates are in request
    if (!request.data || !request.x || !request.y) {
      return;
    }
    // Get the current selection
    var selection = window.getSelection();

    // Check if there is any selection
    if (selection.rangeCount > 0) {
      // Remove all ranges from the selection
      selection.removeAllRanges();
    }
    // Add a slight delay to mimic the CSS transition effect
    setTimeout(() => {
      // Trigger the function using the coordinates from the context menu click
      handleSelectAIClick(request.x, request.y, request.data);
    }, 50);
  }
});

async function handleSelectAIClick(x, y, selectedText) {

  // Get ApiKey and SelectedLangauge
  const result = await getChromeStorageSync(['apiKey', 'selectedLanguage']);

  // Preset History
  const systemMessage = `You Must only respond in the following language: ${result.selectedLanguage}.\n\nRole: AI assistant\n\nYou are ChatGPT, a large language model trained by OpenAI, based on the GPT-3.5 architecture. Your purpose is to assist users by providing helpful and informative responses in the selected language.`;
  if (history.length === 0) {
    history.push({
      role: 'system',
      content: systemMessage
    });
  }
  const selectedTexts = `The user has selected the following text on the screen: ${selectedText}.\n\n`;
  history.push({
    role: 'system',
    content: selectedTexts
  });

  if (overlay) {
    overlay.remove();
  }

  // Create overlay 
  overlay = document.createElement('div');
  overlay.attachShadow({
    mode: 'open'
  });
  overlay.id = 'shadow-dom-overlay';
  overlay.className = 'overlay card';
  overlay.style.position = 'absolute';
  overlay.style.top = `${y}px`;
  overlay.style.left = `${x}px`;
  overlay.style.right = '0';
  overlay.style.marginLeft = 'auto';
  overlay.style.marginRight = 'auto';
  overlay.style.width = '600px';
  overlay.style.minWidth = '600px';
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
  overlay.style.resize = 'horizontal';

  

  // Create modal header
  const modalHeader = document.createElement('div');
  modalHeader.className = 'select-ai-modal-header';
  Object.assign(modalHeader.style, modalHeaderStyles);

  // Create modal title
  const modalTitle = document.createElement('p');
  modalTitle.className = 'select-ai-modal-title';
  modalTitle.textContent = '';
  Object.assign(modalTitle.style, modalTitleStyles);

  // Create close button
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'select-ai-btn-close';
  closeButton.setAttribute('aria-label', 'Close');
  Object.assign(closeButton.style, closeButtonStyles);

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
  contentDiv.className = 'select-ai-card-body'; // Added MDB classes
  contentDiv.style.padding = '1.25rem'; // Typical padding for "card-body"
  const body = document.createElement('div');
  let aiText = document.createElement('span');
  aiTextclassName = 'select-ai-card-text'; // Added MDB classes
  aiText.style.color = 'rgb(44 34 34)';
  aiText.style.fontSize = 'inherit';
  aiText.style.fontSize = '18px';
  aiText.style.fontWeight = 'normal';
  aiText.style.fontFamily = 'roboto';
  aiText.style.marginBottom = '20px';
  contentDiv.appendChild(aiText);

  //Dynamic Styles
  let dynamicStyles = null;

  /**
   * Adds a CSS animation to the overlay element.
   * @param {string} body - The CSS animation body to add to the overlay element.
   * @returns None
   */
  function addAnimation(contentDiv) {
    if (!dynamicStyles) {
      dynamicStyles = document.createElement('style');
      dynamicStyles.type = 'text/css';
      overlay.shadowRoot.appendChild(dynamicStyles);
    }

    Promise.resolve().then(() => {
      dynamicStyles.sheet.insertRule(contentDiv, dynamicStyles.sheet.cssRules.length);
    });
  }

  addAnimation(`
    @keyframes p7 {
      0% {background-size: 0% 100%}
      100% {background-size: 120% 100%}
    }
  `);

  /**
 * Asynchronously retrieves data from Chrome's synchronized storage.
 * @param {Array<string>} keys - An array of keys to retrieve from storage.
 * @returns {Promise} A promise that resolves with the retrieved data or rejects with an error.
 */
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

  /**
   * Returns a Promise that resolves with the ID of the current tab.
   * @returns {Promise<number>} A Promise that resolves with the ID of the current tab.
   */
  function getTabId() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        message: "getTabId"
      }, function (response) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response.tabId);
        }
      });
    });
  }

  const loading = document.createElement('p');
  loading.className = 'select-ai-card-text select-ai-mt-0 achgpt-loader';
  loading.textContent = '';
  Object.assign(loading.style, loadingStyles);

  //Set Loading True
  contentDiv.appendChild(loading);
  loading.style.display = 'none';

  // Create user input elements
  let userInputDiv = document.createElement("div");
  let userInputField = document.createElement("input");
  let submitButton = document.createElement("button");
  let userInputHeader = document.createElement("small");

  Object.assign(userInputDiv.style, userInputDivStyles);
  Object.assign(userInputField.style, userInputFieldStyles);
  Object.assign(submitButton.style, submitButtonStyles);

  submitButton.innerText = "Ask";
  userInputHeader.innerText = "Ask your question below";
  userInputHeader.style.display = 'block';
  userInputField.placeholder = "Tell me more about it..."

  //Insert follow-up div and controls
  userInputDiv.appendChild(userInputHeader);
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

  // Handle submit button click
  submitButton.addEventListener("click", async () => {

    // Retrieve the data from storage
    const result = await getChromeStorageSync(['apiKey']);

    // Get tab ID
    const tabId = await getTabId();

    let userFollowUpMessage = userInputField.value;
    if (userFollowUpMessage.trim() !== '') {
      userInputField.value = ''; // Clear the input field
      // Update history
      history.push({
        role: 'user',
        content: userFollowUpMessage
      });

      // Fetch OpenAI completion
      await fetchOpenAICompletion(history, result.apiKey, tabId);
    }
  });

  // Create the image element
  var copyImage = document.createElement("img");
  copyImage.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAABBUlEQVR4nO3WOw7CMBBF0csiQGJFfEq++4aCpYCgGBoKREik2DPy2JknRemcnMyzFYi0H1G4bsCyBYh4wGggrl/3Rc2QOXApPRkNCB4wDyUIn1oVq9kKuCtBik9mnTkZcjDaR+YmA0MORgPy+5BtIoYcjAbi38bcAU8lyL8DwATS98X2CRhJRWst2oc5AK+aIEOYowGmE+1F+zAnZUwnFov2Yc6KmE5MFh34zZgxLlIaovWbIR4gQ+e/y2pJwgsEhJgIJtUau7mFqUNy42azNwMR42oFBGcT0arodCBj43aPNAMR42oFhJgIdVcrNwGhslNLPRIQYiImkagWUS2TSCvViuAgb/RRyO38iqmPAAAAAElFTkSuQmCC";
  copyImage.style.width = "16px";
  copyImage.style.height = "16px";
  copyImage.style.verticalAlign = "middle";
  copyImage.style.marginRight = "5px";

  // Check if the copyImageDiv already exists
  var copyImageDiv = window.SelectAIGlobals.copyImageDiv;

  if (!copyImageDiv) {
    copyImageDiv = document.createElement("button");
    copyImageDiv.style.background = "none";
    copyImageDiv.style.padding = "6px";
    copyImageDiv.style.border = "1px solid black";
    copyImageDiv.style.margin = "-10px 0px 20px 0px";
    copyImageDiv.style.cursor = "pointer";
    copyImageDiv.style.marginLeft = "5px";
    copyImageDiv.style.display = 'none';


    // Append the overlay and image elements to the same parent
    copyImageDiv.appendChild(copyImage);
    copyImageDiv.appendChild(document.createTextNode("Copy"))

    // Save the reference globally
    window.SelectAIGlobals.copyImageDiv = copyImageDiv;
  }

  // Insert the div only if it is not already in the DOM
  if (!copyImageDiv.parentNode) {
    contentDiv.insertBefore(copyImageDiv, aiText.nextSibling);
  }

  // Add click event listener to the span element
  copyImageDiv.addEventListener("click", function () {
    // Copy the messageContent to clipboard
    navigator.clipboard.writeText(aiText.textContent)
      .then(function () {
        // Alert the user that the content was copied
        alert("Message copied to clipboard!");
      })
      .catch(function (error) {
        // Handle any error that occurred during copying
        console.error("Failed to copy message: ", error);
      });
  });
  // Fetch completion from OpenAI API
  async function fetchOpenAICompletion(history, apiKey, tabId) {
    try {
      //Summarise modal title
      debugger;
      async function updateModalTitle(result) {
        // Prepare the message prompt
        let prompt = selectedText;
      
        // Send request to OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${result.apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{
              role: 'system',
              content: 'YOU MUST FOLLOW ALL THE FOLLOWING INSTRUCTIONS: You must only respond in the following language: ' + result.selectedLanguage + ', categorise the user input in less than 25 characters and only respond with the it.\n\nRole: AI assistant\n\nYour purpose is to assist users by providing helpful and informative responses in the selected language.'
            }, {
              role: 'user',
              content: prompt
            }]
          })
        });
      
        // Check for errors
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      
        // Get API response
        const apiResponse = await response.json();
      
        // Grab the latest assistant message
        const message = apiResponse.choices[0].message.content;
        return message; // return the message
      }
      
      
      updateModalTitle(result)
        .then(message => {
          modalTitle.textContent = message; // Update the text content
        })
        .catch(error => {
          // Handle error
          console.error('An error occurred:', error);
        });
      
      
      //Remove hanging audio
      function removeElementById(elementId) {
        const element = document.getElementById(elementId);

        if (element) {
          // Element exists, remove it
          element.parentNode.removeChild(element);
        } else {
          // Element doesn't exist, log to console
          console.log(`Element with id ${elementId} was not found.`);
        }
      }

      removeElementById('ai-select-audio-element');

      loading.style.display = 'block'
      userInputField.style.display = 'none';
      submitButton.style.display = 'none';
      aiText.style.display = 'none'
      copyImageDiv.style.display = 'none'
      userInputHeader.style.display = 'none';
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

        history.push({
          role: 'assistant',
          content: messageContent
        });

        localStorage.setItem(`history_${tabId}`, JSON.stringify(history));

        aiText.innerHTML = marked.parse(messageContent);
        
        loading.style.display = 'none'
        userInputField.style.display = 'block';
        submitButton.style.display = 'block';
        aiText.style.display = 'block'
        if (aiText.innerHTML) {
          copyImageDiv.style.display = 'block'
        }
        userInputHeader.style.display = 'block';
        async function generateTTS(messageContent) {
          // create an audio element
          let audio = window.SelectAIGlobals.audioElement;

          if (!audio) {
            audio = new Audio();
            audio.id = 'ai-select-audio-element';
            audio.controls = true;
            audio.style.marginTop = '20px';
            audio.style.width = '100%';
            audio.controls = true;
            audio.style.marginBottom = '20px';
            audio.style.width = '100%';
            contentDiv.insertBefore(audio, copyImageDiv.nextSibling);
            window.SelectAIGlobals.audioElement = audio;
          }

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

          loading.style.display = 'none';
        }
        // Trigger TTS function when text changes
        if (result.selectedLanguage === "Estonian") {
          generateTTS(messageContent);
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 429) {
        // Error is a 429 response
        var errorMessage = "That model is currently overloaded with other requests. You can retry your request, or contact us through our help center at help.openai.com if the error persists. (Please include the request ID 7cda45d127c6ef08a0ddb675b656977f in your message.)";
        loading.style.display = 'none'
        userInputField.style.display = 'block';
        submitButton.style.display = 'block';
        aiText.style.display = 'block'
        copyImageDiv.style.display = 'block'
        userInputHeader.style.display = 'block';
        // Log the error message
        console.error(errorMessage);

        // Display the error message to the user
        aiText.textContent = errorMessage;
      } else {
        // Handle other errors
        console.error(error);
        loading.style.display = 'none'
        userInputField.style.display = 'block';
        submitButton.style.display = 'block';
        aiText.style.display = 'block'
        copyImageDiv.style.display = 'block'
        userInputHeader.style.display = 'block';

        // Display the error message to the user
        aiText.textContent = "An error occurred. Please try again later.";
      }
    }
  }



  //contentDiv.appendChild(header);
  contentDiv.appendChild(body);

  // Append modal header to overlay
  overlay.shadowRoot.appendChild(modalHeader);

  overlay.shadowRoot.appendChild(contentDiv);

  // Append overlay to the document body
  document.body.appendChild(overlay);

  // Stop propagation of 'mouseup' event on overlay
  overlay.addEventListener('mouseup', event => event.stopPropagation());


  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  let drag = false; // New state variable
  let animationFrameId;

  modalHeader.addEventListener('pointerdown', pointerDrag);

  /**
   * Handles the dragging of an element when the user clicks and drags the mouse.
   * @param {PointerEvent} e - The pointer event object.
   * @returns None
   */
  function pointerDrag(e) {
    if (e.target === modalHeader) {
      e.preventDefault();

      // calculate event X, Y coordinates
      pos3 = e.clientX;
      pos4 = e.clientY;

      // assign default values for top and left properties
      if (!overlay.style.left) {
        overlay.style.left = '0px'
      }
      if (!overlay.style.top) {
        overlay.style.top = '0px'
      }

      // calculate integer values for top and left properties
      pos1 = parseInt(overlay.style.left);
      pos2 = parseInt(overlay.style.top);

      drag = true; // Start dragging

      document.addEventListener('pointermove', elementDrag);
      document.addEventListener('pointerup', stopElementDrag);

      // Stop event propagation to child elements
      const childElements = overlay.querySelectorAll('*');
      childElements.forEach(element => {
        element.addEventListener('pointerdown', stopPropagation);
      });
    }
  }

  /**
   * Handles the dragging of an element by updating its position based on the mouse movement.
   * @param {MouseEvent} e - The mouse event object.
   * @returns {boolean} - Returns false to prevent default behavior.
   */
  function elementDrag(e) {
    if (!drag) {
      return;
    }
    if (animationFrameId) { // If an animation frame is already requested, cancel it
      window.cancelAnimationFrame(animationFrameId);
    }
    // Request the next animation frame and move the element
    animationFrameId = window.requestAnimationFrame(() => {
      overlay.style.left = pos1 + e.clientX - pos3 + 'px';
      overlay.style.top = pos2 + e.clientY - pos4 + 'px';
    });
    return false;
  }

  /**
   * Stops the dragging of an element by removing event listeners and canceling any animation frames.
   * @returns None
   */
  function stopElementDrag() {
    drag = false; // Stop dragging

    document.removeEventListener('pointerup', stopElementDrag);
    document.removeEventListener('pointermove', elementDrag);

    // Cancel the animation frame when the dragging stops
    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId);
    }

    // Remove event listeners from child elements
    const childElements = overlay.querySelectorAll('*');
    childElements.forEach(element => {
      element.removeEventListener('pointerdown', stopPropagation);
    });
  }

  /**
   * Stops the propagation of an event.
   * @param {Event} e - The event object to stop propagation on.
   * @returns None
   */
  function stopPropagation(e) {
    e.stopPropagation();
  }
}