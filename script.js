
// Input Boxes Click Radius

document.querySelector('.input1').addEventListener('click', function() {
  document.querySelector('#text-input1').focus();
});
document.querySelector('.input2').addEventListener('click', function() {
  document.querySelector('#text-input2').focus();
});


// Language Picker

document.addEventListener('DOMContentLoaded', function() {
  const boxes = document.querySelectorAll('.lang-box');
  const overlay = document.querySelector('.overlay');

  boxes.forEach(box => {
    box.addEventListener('click', function() {
      // Remove expanded class from any box that has it
      boxes.forEach(b => b.classList.remove('expanded'));

      // Add expanded class to the clicked box
      box.classList.add('expanded');

      // Show the overlay
      overlay.classList.add('active');
    });
  });

  // Hide the overlay and reset the boxes if overlay is clicked
  overlay.addEventListener('click', function() {
    overlay.classList.remove('active');
    boxes.forEach(box => box.classList.remove('expanded'));
  });
});


// Translation Code

const languageInput = document.getElementById('languageInput');
const textInput = document.getElementById('textInput');

function translateText() {
  const language = document.getElementById('languageInput').value;
  const text = document.getElementById('textInput').value;
  const output = document.getElementById('translationOutput');

  textInput.value = '';

  const requestBody = JSON.stringify({
    model: "gpt-3.5-turbo",
    messages: [{
      role: "system",
      content: `You are a highly accurate translator, rendering phrases just as a local would say them.

Upon receiving "French," identify the primary language spoken there. If it's a specific language name, ensure any spelling errors are corrected.

Format: "Dialect: {language}"

Translate "Hello" into this language, capturing the authentic local usage.

Include phonetic pronunciation for clarity. For languages using non-Latin scripts, provide the original text in brackets.

Format: "Translation: {translation} [{pronunciation}]"`
    }, {
      role: "user",
      content: text
    }]
  });

  console.log('Request Body:', requestBody); // Log the request body

  fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: requestBody
  })
    .then(response => response.json())
    .then(data => {
      console.log('API Response:', data); // Log the full API response
      const botMessage = data.choices[0].message.content;

      // Extract the dialect/language and translation from the botMessage
      const dialectMatch = botMessage.match(/Dialect:\s*(.+)/i);
      const translationMatch = botMessage.match(/Translation:\s*(.+)/i);

      // Check if the regex found matches and assign the capturing group content
      const dialect = dialectMatch ? dialectMatch[1].trim() : 'No dialect found';
      const translation = translationMatch ? translationMatch[1].trim() : 'No translation found';

      // Only display the translation (not the entire bot message)
      displayBotMessage(`Translation in ${dialect}: "${text}"`);
      displayBotMessage(`${translation}`);

    })
    .catch(error => {
      console.error('Error:', error);
      displayBotMessage('Failed to connect. Please check your settings and try again.');
    });
}