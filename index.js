let selectedText = '';
let askChatGPT;
let overlay;
let conversations = {};

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

window.addEventListener("load", clearHistory);

function getSelectionEndCoordinates() {
  var sel = window.getSelection();
  if (sel.rangeCount > 0) {
    var range = sel.getRangeAt(0).cloneRange(); // clone the range to avoid side effects

    var startNode = range.startContainer;
    var startOffset = range.startOffset;
    var endNode = range.endContainer;
    var endOffset = range.endOffset;

    if (
      (startNode.compareDocumentPosition(endNode) === Node.DOCUMENT_POSITION_FOLLOWING && startOffset > endOffset) ||
      (startNode === endNode && startOffset > endOffset)
    ) {
      var tempNode = startNode;
      var tempOffset = startOffset;
      startNode = endNode;
      startOffset = endOffset;
      endNode = tempNode;
      endOffset = tempOffset;
    }

    range.setEnd(endNode, endOffset); // set the end point of the range
    var rect = range.getBoundingClientRect(); // get the bounding rectangle of the range

    var x = rect.left + rect.width;
    var y = rect.top + rect.height;

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

  if (askChatGPT) {
    askChatGPT.remove();
  }

  if (overlay) {
    overlay.remove();
  }

  if (selectedText) {

    const coords = getSelectionEndCoordinates();

    askChatGPT = document.createElement('a');
    askChatGPT.className = 'btn text-white';
    askChatGPT.role = 'button';
    askChatGPT.style.backgroundColor = '#75A99C';
    askChatGPT.innerHTML = `
    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAACjUlEQVR4nMWVXWjOYRjGN1tb+Vx2ojHCjlbmZCdeTnzUduBAw8EwtRNq5COM2AEpH0VJEbGVSNoBsXqViA2ltKMdTAkh37xl8pG1/XTNVZ49+78aU+56e//P/Tz3dT3355OT8z8FyAMagA7gC/ABuAos/hfgY4Hb/BQRHAJOAU+sOwnMBGYDhX9DcBH4CqyM9GXASwbLN+ACMGO44ItsuC3QjQZ2O1SfgRPAMoUL2AtkgPdAxe+A5wH3DS6gAutrgWdAP3AeKE2wnQI8Ah4nhgxYCvTafYF1Wl9jQhHPDZK/BjgHVAYYC3x2VQxeAnwEbgETgJv6eW+DjYq9rgK6Ai/7gBZgEpALvFYxxARNwHdgqtchwSaDpYC0v5/b4/HAQSe5B2gEHijhMcEN3T5YhwRbDNrnRL5zKI8ARUFlXQ6qal9MoDq/loWg0UZHFSZgInDMujdAvULjs6vtTVtM0Ay8AvK9Tvu2dcBOgw1UVJBkySf/3wPKvbfeuuqQoNrKdV6X2ygEGSD3foF1u3wJXSbtvXwnujn24ordq/N6lN1XGCTHHZ5ih0uyPQ6p19eB9phgP7/kkuaM9UVOaK87NeOES7ZmIbgjkpigFeh2UnvszQFgnJtNpYnzM8ffmxOKYppLvikmOO1E57ppWnxTNRNuriqfVagkG0MCT+AON21JTKBkSeYHukrgrMdCnnWpYF7VWNcJPPUs0u2XDAL3oUIPqofA5IT9Ug+6fs+q2sBOYx1XXmoIeABS4Vcr48QuB1YAZzyiFa49Gt2BzQ6DL8wKHJFM9+OhJIfyIn5Q3Lm6feuwwCNjNdMsgboHJIqxvg8Dd61rB8b8MUECobq9DXjrEKpa1qohRww+EvkBv1+bKH737dgAAAAASUVORK5CYII=" alt="Icon">
  Ask ChatGPT
`;
    askChatGPT.style.position = 'absolute';
    askChatGPT.style.top = `${coords.y + 5}px`;
    askChatGPT.style.left = `${coords.x - 151}px`;
    askChatGPT.style.zIndex = '9999';
    askChatGPT.style.textTransform = 'math-auto';
    askChatGPT.style.textDecoration = 'none';
    askChatGPT.style.fontWeight = 'bold';

    document.body.appendChild(askChatGPT);
    // Stop propagation of 'mouseup' event on button
    askChatGPT.addEventListener('mouseup', event => event.stopPropagation());

    // Add a slight delay to ensure the CSS transition plays
    setTimeout(() => {
      askChatGPT.classList.add('show');
    }, 50);

    // Pass the coordinates of the button to the click handler
    askChatGPT.addEventListener('click', () => handleaskChatGPTClick(event.pageX + 20, event.pageY + 20));
  }
}

// Function to handle Ask GPT button click
async function handleaskChatGPTClick(x, y) {
  askChatGPT.remove();

  overlay = document.createElement('div');
  overlay.className = 'overlay card'; // Added MDB classes
  overlay.style.position = 'absolute';
  overlay.style.top = `${y}px`;
  overlay.style.left = '20%';
  overlay.style.width = '60%';
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

  // Create modal header
  const modalHeader = document.createElement('div');
  modalHeader.className = 'modal-header';

  // Create modal title
  const modalTitle = document.createElement('h5');
  modalTitle.className = 'modal-title';
  modalTitle.textContent = ' ';
  modalTitle.style.fontSize = '1em';

  // Create close button
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'btn-close';
  closeButton.setAttribute('data-mdb-dismiss', 'modal');
  closeButton.setAttribute('aria-label', 'Close');

  // Append modal title and close button to modal header
  modalHeader.appendChild(modalTitle);
  modalHeader.appendChild(closeButton);

  //close everything once clicked
  closeButton.addEventListener('click', () => {
    overlay.remove();
    askChatGPT.remove();
  });

  const contentDiv = document.createElement('div');
  contentDiv.className = 'content card-body'; // Added MDB classes
  contentDiv.style.padding = '1.25rem'; // Typical padding for "card-body"
  const body = document.createElement('div');

  //indicate the bot is loading
  const loading = document.createElement('p');
  loading.className = 'mt-0';
  loading.textContent = 'Thinking...';
  contentDiv.appendChild(loading);

  // Placeholders
  const placeholderGlow = document.createElement('p');
  placeholderGlow.className = 'placeholder-glow';
  const placeholderSpanGlow = document.createElement('span');
  placeholderSpanGlow.className = 'placeholder col-12';
  placeholderGlow.appendChild(placeholderSpanGlow);
  contentDiv.appendChild(placeholderGlow);

  const placeholderWave = document.createElement('p');
  placeholderWave.className = 'placeholder-wave';
  const placeholderSpanWave = document.createElement('span');
  placeholderSpanWave.className = 'placeholder col-12';
  placeholderWave.appendChild(placeholderSpanWave);
  contentDiv.appendChild(placeholderWave);

  chrome.storage.sync.get(['apiKey', 'selectedLanguage', 'leadingPrompt'], async function (result) {
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
    modalTitle.textContent = 'Based on "'+result.leadingPrompt+'" leading prompt';
    function getTabId() {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({message: "getTabId"}, function(response) {
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
        const result = await getChromeStorageSync(['apiKey', 'selectedLanguage', 'leadingPrompt']);
    
        // Get the current tab ID
        const tabId = await getTabId();
        console.log(tabId);  // Use tabId here
    
        // Get the history for this tab
        let history = JSON.parse(localStorage.getItem(`history_${tabId}`)) || [];
    
        // Construct the system message and selected text
        const systemMessage = `Language: ${result.selectedLanguage}. ${result.leadingPrompt}`+'. Make sure carefully consider previous messages when responding'; 
    
        // Push the system message to history only once
        if (history.length === 0) {
          history.push({ role: 'system', content: systemMessage });
        }
    
        // Push the user message to history
        history.push({ role: 'user', content: selectedText });
    
        // Make API call to OpenAI's chat completion endpoint
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
    
          // Handle the API response
          if (response.ok) {
            // Use the message content from the first choice
            const messageContent = data.choices[0].message.content;
    
            // Push the response to history
            history.push({ role: 'assistant', content: messageContent });
    
            // Save the history to localStorage
            localStorage.setItem(`history_${tabId}`, JSON.stringify(history));
    
            // Display the response in the overlay
            body.textContent = messageContent;
          } else {
            // Handle error
            console.error(data);
            body.textContent = 'Error: API Key Missing. Please make sure you include a valid API key set in the settings'
            chrome.runtime.sendMessage({ message: 'MissingAPIKey' });
          }
    
        } catch (error) {
          console.error(error);
        } finally {
          // Hide the placeholders
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
  

  body.className = 'card-text'; // Added MDB classes
  body.style.color = 'rgb(44 34 34)';
  body.style.fontSize = 'inherit';
  body.style.float = 'left';

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

// Listen for text selection
document.addEventListener('mouseup', handleTextSelection);
