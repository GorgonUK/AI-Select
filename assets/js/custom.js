async function fetchLanguages() {
  // list of languages
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

  // get the select element
  const select = document.getElementById('language-select');

  // clear the select element
  select.innerHTML = '';

  // create an option element for each language and append it to the select
  for (const language of languageList) {
    const option = document.createElement('option');
    option.value = language;
    option.textContent = language;
    select.append(option);
  }
}

// call the function
document.addEventListener('DOMContentLoaded', (event) => {
  fetchLanguages();
  
  // current year
const currentYear = new Date().getFullYear();
document.getElementById("current-year").textContent = currentYear;
});

