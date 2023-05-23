let selectedText = '';
let overlay;
let conversations = {};
let loader;
let userInputDiv;
let userInputField;
let submitButton;
let audio;
let lastSelectionCoords = null;

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
    debugger;
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
  modalHeader.className = 'select-ai-modal-header';
  modalHeader.style.display = 'flex';
  modalHeader.style.justifyContent = 'space-between';
  modalHeader.style.alignItems = 'center';
  modalHeader.style.height = '37px';
  modalHeader.style.cursor = 'move';

  // Create modal title
  const modalTitle = document.createElement('h5');
  modalTitle.className = 'select-ai-modal-title';
  modalTitle.textContent = ' ';
  modalTitle.style.fontSize = '1em';

  // Create close button
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'select-ai-btn-close';
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.style.padding = "calc(1rem*0.5) calc(1rem*0.5)";
  closeButton.style.margin = "calc(1rem*-0.5) calc(1rem*-0.5) calc(1rem*-0.5) auto";
  closeButton.style.marginRight = "4px";
  closeButton.style.webkitAppearance = "button";
  closeButton.style.boxSizing = "content-box";
  closeButton.style.width = "1em";
  closeButton.style.height = "1em";
  closeButton.style.color = "rgb(0, 0, 0)";
  closeButton.style.opacity = "0.5";
  closeButton.style.background = 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0 111.414 1.414L9.414 8l6.293 6.293a1 1 0 01-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 01-1.414-1.414L6.586 8 .293 1.707a1 1 0 010-1.414z\'/%3E%3C/svg%3E") 50% center / 1em no-repeat transparent';
  closeButton.style.borderWidth = "0px";
  closeButton.style.borderStyle = "initial";
  closeButton.style.borderColor = "initial";
  closeButton.style.borderImage = "initial";
  closeButton.style.borderRadius = "0.25rem";
  closeButton.style.cursor = "pointer";

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

  //Dynamic Styles
  let dynamicStyles = null;

  /**
   * Adds a CSS animation to the overlay element.
   * @param {string} body - The CSS animation body to add to the overlay element.
   * @returns None
   */
  function addAnimation(body) {
    if (!dynamicStyles) {
      dynamicStyles = document.createElement('style');
      dynamicStyles.type = 'text/css';
      overlay.shadowRoot.appendChild(dynamicStyles);
    }

    Promise.resolve().then(() => {
      dynamicStyles.sheet.insertRule(body, dynamicStyles.sheet.cssRules.length);
    });
  }

  addAnimation(`
  @keyframes p7 {
    0% {background-size: 0% 100%}
    100% {background-size: 120% 100%}
  }
`);

  const loading = document.createElement('p');
  loading.className = 'select-ai-card-text select-ai-mt-0 achgpt-loader';
  loading.textContent = '';
  loading.style.color = 'rgb(44, 34, 34)';
  loading.style.fontSize = '18px';
  loading.style.float = 'left';
  loading.style.fontWeight = 'normal';
  loading.style.fontFamily = 'Roboto';
  loading.style.height = '9px';
  loading.style.width = '84px';
  loading.style.webkitMask = 'radial-gradient(circle closest-side,#000000 94%,#0000) left/20% 100%';
  loading.style.background = 'linear-gradient(#000000 0 0) left/0% 100% no-repeat #E4E4ED';
  loading.style.animation = 'p7 2.5s infinite steps(6)';

  contentDiv.appendChild(loading);

  // Placeholders
  const placeholderGlow = document.createElement('p');
  placeholderGlow.className = 'select-ai-placeholder-glow';
  const placeholderSpanGlow = document.createElement('span');
  placeholderSpanGlow.className = 'select-ai-placeholder select-ai-col-12';
  placeholderGlow.appendChild(placeholderSpanGlow);
  contentDiv.appendChild(placeholderGlow);

  const placeholderWave = document.createElement('p');
  placeholderWave.className = 'placeholder-wave';
  const placeholderSpanWave = document.createElement('span');
  placeholderSpanWave.className = 'select-ai-placeholder select-ai-col-12';
  placeholderWave.appendChild(placeholderSpanWave);
  contentDiv.appendChild(placeholderWave);

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

  /**
   * The main function that handles the user input and generates a response using the GPT-3.5 model.
   * @param {string} inputText - The user's input text.
   * @returns None
   */
  async function main(inputText) {
    try {
      let userInputDiv = document.createElement("div");
      userInputDiv.className = "select-ai-get-in-touch select-ai-contact-form";
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
      userInputField.className = "select-ai-input-text";
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
      submitButton.className = "select-ai-submit-btn";
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

      const result = await getChromeStorageSync(['apiKey', 'selectedLanguage']);

      // Get the current tab ID
      const tabId = await getTabId();
      console.log(tabId); // Use tabId here

      // Get the history for this tab
      let history = JSON.parse(localStorage.getItem(`history_${tabId}`)) || [];

      const systemMessage = `You Must only respond in the following language: ${result.selectedLanguage}.\n\nRole: AI assistant\n\nYou are ChatGPT, a large language model trained by OpenAI, based on the GPT-3.5 architecture. Your purpose is to assist users by providing helpful and informative responses in the selected language.`;

      if (history.length === 0) {
        history.push({
          role: 'system',
          content: systemMessage
        });
      }

      history.push({
        role: 'user',
        content: inputText
      });

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

          history.push({
            role: 'assistant',
            content: messageContent
          });

          localStorage.setItem(`history_${tabId}`, JSON.stringify(history));

          body.textContent = messageContent;

          // Copy Button
          // Create the image element
          var copyImage = document.createElement("img");
          copyImage.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAABBUlEQVR4nO3WOw7CMBBF0csiQGJFfEq++4aCpYCgGBoKREik2DPy2JknRemcnMyzFYi0H1G4bsCyBYh4wGggrl/3Rc2QOXApPRkNCB4wDyUIn1oVq9kKuCtBik9mnTkZcjDaR+YmA0MORgPy+5BtIoYcjAbi38bcAU8lyL8DwATS98X2CRhJRWst2oc5AK+aIEOYowGmE+1F+zAnZUwnFov2Yc6KmE5MFh34zZgxLlIaovWbIR4gQ+e/y2pJwgsEhJgIJtUau7mFqUNy42azNwMR42oFBGcT0arodCBj43aPNAMR42oFhJgIdVcrNwGhslNLPRIQYiImkagWUS2TSCvViuAgb/RRyO38iqmPAAAAAElFTkSuQmCC";
          copyImage.style.width = "16px";
          copyImage.style.height = "16px";
          copyImage.style.verticalAlign = "middle";
          copyImage.style.marginRight = "5px";

          // Add click event listener to the span element
          copyImage.addEventListener("click", function () {
            // Copy the messageContent to clipboard
            navigator.clipboard.writeText(messageContent)
              .then(function () {
                // Alert the user that the content was copied
                alert("Message copied to clipboard!");
              })
              .catch(function (error) {
                // Handle any error that occurred during copying
                console.error("Failed to copy message: ", error);
              });
          });

          // Append the overlay and image elements to the same parent
          var copyImageDiv = document.createElement("button");
          copyImageDiv.style.background = "none";
          copyImageDiv.style.border = "none";
          copyImageDiv.style.padding = "0";
          copyImageDiv.style.margin = "0";
          copyImageDiv.style.cursor = "pointer";
          copyImageDiv.style.marginLeft = "5px";

          copyImageDiv.appendChild(copyImage);
          body.appendChild(copyImageDiv);


          // Get TTS for Estonian
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
          chrome.runtime.sendMessage({
            message: 'MissingAPIKey'
          });
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

  body.className = 'select-ai-card-text'; // Added MDB classes
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