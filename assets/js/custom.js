// create an async function to fetch data from the API
async function fetchLanguages() {
    const response = await fetch('https://restcountries.com/v3.1/all');
    const countries = await response.json();
  
    // create a Set to store unique languages
    const languages = new Set();
  
    // loop over each country
    for (const country of countries) {
      // loop over the languages of each country
      for (const langCode in country.languages) {
        const langName = country.languages[langCode];
        // add the language to the Set
        languages.add(JSON.stringify({ code: langCode, name: langName }));
      }
    }
  
    // convert Set to an array and sort it by language name
    const sortedLanguages = Array.from(languages)
      .map(language => JSON.parse(language))
      .sort((a, b) => a.name.localeCompare(b.name));
  
    // get the select element
    const select = document.getElementById('language-select');
  
    // clear the select element
    select.innerHTML = '';
  
    // create an option element for each language and append it to the select
    for (const language of sortedLanguages) {
      const { code, name } = language;
      const option = document.createElement('option');
      option.value = code;
      option.textContent = name;
      select.append(option);
    }
  }
  
  // call the function
  fetchLanguages();
  