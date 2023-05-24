async function fetchLanguages() {
  // List of languages
  const languageList = [
    'Afrikaans', 'Albanian', 'Amharic', 'Arabic', 'Armenian', 'Azerbaijani', 'Basque', 
    'Belarusian', 'Bengali', 'Bosnian', 'Bulgarian', 'Burmese', 'Catalan', 'Cebuano', 
    'Chichewa', 'Chinese (Cantonese)', 'Chinese (Mandarin)', 'Corsican', 'Croatian', 
    'Czech', 'Danish', 'Dutch', 'English', 'Esperanto', 'Estonian', 'Farsi', 'Filipino', 
    'Finnish', 'French', 'Frisian', 'Galician', 'Georgian', 'German', 'Greek', 'Gujarati', 
    'Haitian Creole', 'Hausa', 'Hawaiian', 'Hebrew', 'Hindi', 'Hmong', 'Hungarian', 
    'Icelandic', 'Igbo', 'Indonesian', 'Irish', 'Italian', 'Japanese', 'Javanese', 
    'Kannada', 'Kazakh', 'Khmer', 'Kinyarwanda', 'Korean', 'Kurdish (Kurmanji)', 'Kyrgyz', 
    'Lao', 'Latin', 'Latvian', 'Lithuanian', 'Luxembourgish', 'Macedonian', 'Malagasy', 
    'Malay', 'Malayalam', 'Maltese', 'Maori', 'Marathi', 'Mongolian', 'Nepali', 'Norwegian', 
    'Odia (Oriya)', 'Pashto', 'Persian', 'Polish', 'Portuguese', 'Punjabi', 'Romanian', 
    'Russian', 'Samoan', 'Scots Gaelic', 'Serbian', 'Sesotho', 'Shona', 'Sindhi', 'Sinhala', 
    'Slovak', 'Slovenian', 'Somali', 'Spanish', 'Sundanese', 'Swahili', 'Swedish', 'Tajik', 
    'Tamil', 'Tatar', 'Telugu', 'Thai', 'Turkish', 'Turkmen', 'Ukrainian', 'Urdu', 'Uyghur', 
    'Uzbek', 'Vietnamese', 'Welsh', 'Xhosa', 'Yiddish', 'Yoruba', 'Zulu'
  ];

  // Get the select element
  const select = document.getElementById('language-select');

  // Clear the select element
  select.innerHTML = '';

  // Create an option element for each language and append it to the select
  for (const language of languageList) {
    const option = document.createElement('option');
    option.value = language;
    option.textContent = language;
    select.append(option);
  }
}

// Call the function
document.addEventListener('DOMContentLoaded', (event) => {
  fetchLanguages();
  
  // Current year
const currentYear = new Date().getFullYear();
document.getElementById("current-year").textContent = currentYear;
});

document.addEventListener('DOMContentLoaded', function() {
  var submitFeedback = function() {
    // User input value
    var feedback = document.getElementById('submitFeedbackInput').value;

    // Current date and time
    var date = new Date().toISOString();

    // Browser type and version
    var userAgent = navigator.userAgent;

    // Connection information
    var connection = navigator.connection ? navigator.connection.effectiveType : 'unknown';

    // Firebase endpoint
    var firebaseUrl = 'https://select-ai-firebase-default-rtdb.europe-west1.firebasedatabase.app/.json';

    // Data to be sent
    var data = {
      feedback: feedback,
      date: date,
      userAgent: userAgent,
      connection: connection
    };

    // Send a POST request to Firebase
    fetch(firebaseUrl, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
      // Clear the input field
      document.getElementById('submitFeedbackInput').value = '';
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  };

  document.getElementById('submitFeedbackButton').addEventListener('click', submitFeedback);

  document.getElementById('submitFeedbackInput').addEventListener('keyup', function(event) {
    // 'Enter' is the "Enter" key on the keyboard
    if (event.key === 'Enter') {
      // Cancel the default action, if needed
      event.preventDefault();
      // Trigger the button element with a click
      document.getElementById('submitFeedbackButton').click();
    }
  });
});




