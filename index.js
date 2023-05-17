let selectedText = '';
let askGptButton;
let overlay;



// Function to handle text selection
function handleTextSelection(event) {
  const selection = window.getSelection();

  selectedText = selection.toString().trim();

  if (askGptButton) {
    askGptButton.remove();
  }

  if (overlay) {
    overlay.remove();
  }

  if (selectedText) {
    askGptButton = document.createElement('button');
    askGptButton.className = 'btn btn-primary askGptButton'; // Added MDB classes
    askGptButton.textContent = 'Ask AI';
    askGptButton.style.position = 'absolute';
    askGptButton.style.top = `${event.pageY + 20}px`;
    askGptButton.style.left = `${event.pageX + 20}px`;

    askGptButton.style.webkitBorderRadius = '28px';
    askGptButton.style.mozBorderRadius = '28px';
    askGptButton.style.borderRadius = '28px';
    askGptButton.style.fontFamily = 'Arial';
    askGptButton.style.color = '#ffffff';
    askGptButton.style.fontSize = 'inherit';
    askGptButton.style.fontWeight = 'inherit';
    askGptButton.style.fontFamily = 'inherit';
    askGptButton.style.background = '#422F70';
    askGptButton.style.padding = '10px 20px';
    askGptButton.style.textDecoration = 'none';
    askGptButton.style.border = 'none';
    askGptButton.style.boxShadow = '0 4px 8px 0 rgba(66, 47, 112,0.2), 0 6px 20px 0 rgba(66, 47, 112,0.19)';

    document.body.appendChild(askGptButton);



    // Stop propagation of 'mouseup' event on button
    askGptButton.addEventListener('mouseup', event => event.stopPropagation());

    // Add a slight delay to ensure the CSS transition plays
    setTimeout(() => {
      askGptButton.classList.add('show');
    }, 50);

    // Pass the coordinates of the button to the click handler
    askGptButton.addEventListener('click', () => handleAskGptButtonClick(event.pageX + 20, event.pageY + 20));
  }
}

// Function to handle Ask GPT button click
async function handleAskGptButtonClick(x, y) {
  askGptButton.remove();

  overlay = document.createElement('div');
  overlay.className = 'overlay card'; // Added MDB classes
  overlay.style.position = 'absolute';
  overlay.style.top = `${y}px`;
  overlay.style.left = '20%'; // Adjust the left positioning as desired
  overlay.style.width = '60%'; // Adjust the width as desired
  overlay.style.marginTop = '20px';
  overlay.style.zIndex = '9999';
  overlay.style.overflow = 'auto';
  overlay.style.minHeight = '200px';

  overlay.style.backgroundColor = '#422F70'; // Replace with actual "overlay" styles
  overlay.style.padding = '15px';
  overlay.style.boxShadow = '0 4px 8px 0 rgba(66, 47, 112,0.2), 0 6px 20px 0 rgba(66, 47, 112,0.19)';
  overlay.style.borderRadius = '5px';

  overlay.style.fontSize = 'inherit';
  overlay.style.fontWeight = 'inherit';
  overlay.style.fontFamily = 'inherit';



  const contentDiv = document.createElement('div');
  contentDiv.className = 'content card-body'; // Added MDB classes
  contentDiv.style.padding = '1.25rem'; // Typical padding for "card-body"
  const closeButton = document.createElement('button');
  closeButton.textContent = 'X';
  const body = document.createElement('div');

  // Create a spinner and add it to the overlay
  const spinner = document.createElement('div');
  spinner.className = 'spinner-border';  // Style this class in your CSS to create a loading spinner
  overlay.appendChild(spinner);

// Get the API key, selected language, and leading prompt from chrome.storage
chrome.storage.sync.get(['apiKey', 'selectedLanguage', 'leadingPrompt'], async function(result) {
  if (!result.apiKey) {
    body.textContent = "API Key not found. Please check your settings.";
    spinner.style.display = 'none';
    return;
  }

  // Construct the system message and selected text
  const systemMessage = result.leadingPrompt; // Use leadingPrompt as the system message
  const selectedLanguage = result.selectedLanguage;


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
          messages: [
            { role: 'system', content: systemMessage + '. Keep your response brief and informative' },
            { role: 'user', content: selectedText + ' in ' + selectedLanguage}
          ],
        }),
      });
      console.log(response);
      const data = await response.json();

      // Handle the API response
      if (response.ok) {
        // Use the message content from the first choice
        const messageContent = data.choices[0].message.content;
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
      // Hide the spinner
      spinner.style.display = 'none';
    }
  });



  body.textContent = selectedText;
  body.className = 'card-text'; // Added MDB classes
  body.style.color = '#fff';
  //body.style.fontSize = '1rem'; // Typical for "card-text"
  body.style.fontSize = 'inherit';
  body.style.float = 'left';

  //contentDiv.appendChild(header);
  contentDiv.appendChild(body);

  overlay.appendChild(contentDiv);
  document.body.appendChild(overlay);

  // Stop propagation of 'mouseup' event on overlay
  overlay.addEventListener('mouseup', event => event.stopPropagation());
}

// Listen for text selection
document.addEventListener('mouseup', handleTextSelection);
