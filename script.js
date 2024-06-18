// Reused Functions

async function getPrompt(promptNumber) {
  try {
    const response = await fetch("prompts.txt");
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const data = await response.text();

    let sysprompt = data.split("\n\n")[promptNumber - 1];
    const firstDotIndex = sysprompt.indexOf(".");
    if (firstDotIndex !== -1) {
      sysprompt = sysprompt.substring(firstDotIndex + 1).trim();
    }

    const [system, prompt] = sysprompt.split("*/*");
    return { system, prompt };
  } catch (error) {
    throw new Error(`Error reading file: ${error.message}`);
  }
}

async function chatgptRequest(model, system, prompt, key) {
  const messages = [];

  if (system) {
    messages.push({
      role: "system",
      content: system,
    });
  }

  messages.push({
    role: "user",
    content: prompt,
  });

  const requestBody = JSON.stringify({
    model: model,
    messages: messages,
  });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: requestBody,
  });

  const data = await response.json();
  const botMessage = data.choices[0].message.content; // Return the message content
  return botMessage;
}

// Checking if API key is valid every 2 seconds

const intervalId = setInterval(function () {
  const apiKey = document.getElementById("apiKeyInput").value;
  if (apiKey) {
    chatgptRequest("gpt-3.5-turbo", "", "say 1", apiKey).then((response) => {
      if (response) {
        document.getElementById("apiKeyInput").style.display = "none";
        // Store the API key in localStorage or a variable for later use
        key = apiKey;
        clearInterval(intervalId);
      }
    });
  }
}, 2000);

// Loading Languages

function createLanguageItem(language, flagUrl, location) {
  const li = document.createElement("li");
  li.onclick = () => selectLanguage(language, flagUrl);

  const flagDiv = document.createElement("div");
  flagDiv.classList.add("flag");

  const img = document.createElement("img");
  img.src = flagUrl;
  flagDiv.appendChild(img);

  const div = document.createElement("div");
  div.classList.add("langchoice-text");
  div.innerHTML = `${language}${location ? `<small>${location}</small>` : ""}`;

  li.appendChild(flagDiv);
  li.appendChild(div);

  return li;
}

async function loadLanguages() {
  try {
    const response = await fetch("recent-langs.txt");
    const text = await response.text();
    const lines = text.trim().split("\n");

    const languageList = document.getElementById("language-list");
    lines.forEach((line) => {
      const [language, flagUrl, location] = line.split("|");
      const langItem = createLanguageItem(language, flagUrl, location);
      languageList.appendChild(langItem);
    });
  } catch (error) {
    console.error("Error loading languages:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadLanguages);

// Input Boxes Click Radius

document.querySelector(".input1").addEventListener("click", function (event) {
  if (
    event.target.classList.contains("microphone") ||
    event.target.id === "playButton"
  ) {
    event.stopPropagation();
  } else {
    document.querySelector("#text-input1").focus();
  }
});

document.querySelector(".input2").addEventListener("click", function (event) {
  if (
    event.target.classList.contains("microphone") ||
    event.target.id === "playButton"
  ) {
    event.stopPropagation();
  } else {
    document.querySelector("#text-input2").focus();
  }
});

// Font Size Based on Length

function adjustFontSize(textLength) {
  var calculatedFontSize = Math.round((-0.06 * textLength + 20.06) * 2) / 2;
  var fontSize = calculatedFontSize < 15 ? 15 : calculatedFontSize;
  return fontSize + "px";
}

function handleInputEvent(inputElement) {
  var textLength = inputElement.textContent.trim().length;
  inputElement.style.fontSize = adjustFontSize(textLength);
}

var inputElements = document.querySelectorAll(".text-input");
inputElements.forEach(function (inputElement) {
  inputElement.addEventListener("input", function () {
    handleInputEvent(inputElement);
  });
});

// Placeholder Text

function clearPlaceholder(element) {
  if (element.textContent.trim() === element.getAttribute("data-placeholder")) {
    element.textContent = "";
  }
}

// Language Picker

let currentBox = null;

document.getElementById("box1").addEventListener("click", function () {
  currentBox = "box1";
  openOverlay();
});

document.getElementById("box2").addEventListener("click", function () {
  currentBox = "box2";
  openOverlay();
});

function openOverlay() {
  document.getElementById("langchoice-overlay").style.display = "flex";
  document.querySelector('.langchoice-input input[type="text"]').focus();
}

function closeOverlay() {
  document.getElementById("langchoice-overlay").style.display = "none";
}

async function selectLanguage(language, flagSrc) {
  language = language.replace(/standard/gi, "").trim();

  const box = document.getElementById(currentBox);
  box.querySelector(".box-text").innerText = language;

  const flagImg = box.querySelector(".flag img");
  flagImg.src = flagSrc;

  const currentBoxId = currentBox.replace("box", "");
  closeOverlay();

  // Adjusting language label
  const languageLabel = document.querySelector(
    `.input-container.input${currentBoxId} .language-label`,
  );
  languageLabel.innerText = language;

  // Adjusting placeholder text
  const botMessage = await chatgptRequest(
    "gpt-3.5-turbo",
    "Strictly follow the format: Translation: {translation}",
    `Translate into ${language}: Enter text to translate`,
    key,
  );

  const translationMatch = botMessage.match(/Translation:\s*(.*)/);
  if (translationMatch) {
    const translation = translationMatch[1] + "..";
    document
      .querySelector(`.input-container.input${currentBoxId} .text-input`)
      .setAttribute("data-placeholder", translation);
  } else {
    console.error("Translation format not found in the response.");
  }
}

// Input Language Code

document.addEventListener("DOMContentLoaded", async () => {
  // Button Opacity (CONFIRM)
  const inputField = document.querySelector(
    '.langchoice-input input[type="text"]',
  );
  inputField.addEventListener("input", () => {
    if (inputField.value.trim() !== "") {
      confirmArrow.style.opacity = 0.8;
      confirmArrow.style.cursor = "pointer";
    } else {
      confirmArrow.style.opacity = 0.4;
      confirmArrow.style.cursor = "default";
    }
  });

  // Getting Flag
  function getFlagUrl(country_code) {
    return (flagSrc = country_code
      ? `https://flagsapi.com/${country_code}/flat/64.png`
      : "");
  }

  // If Button Clicked
  const confirmArrow = document.querySelector(".confirm-arrow");
  confirmArrow.addEventListener("click", async () => {
    const userInput = inputField.value;

    // Dialect or Place?
    var botMessage = await chatgptRequest(
      "gpt-3.5-turbo",
      "Give 1 word response, language, dialect or place",
      `${userInput}: language, dialect or place?`,
      key,
    );
    botMessage = botMessage.toLowerCase();
    let country_code = "";
    let language = "";

    // Dialect
    if (botMessage.includes("dialect") || botMessage.includes("language")) {
      botMessage = await chatgptRequest(
        "gpt-3.5-turbo",
        "Strictly follow the format: Language: {language}, Country Code: {country_code}",
        `Correct any spelling errors in ${userInput} and identify the country most associated with this language, giving its country code in ISO 3166 Format.`,
        key,
      );
      language = botMessage.match(/Language:\s*([^,]*)/)[1].trim();
      country_code = botMessage.match(/Country Code:\s*([^,]*)/)[1].trim();

      const flagSrc = getFlagUrl(country_code);
      selectLanguage(language, flagSrc);
    }

    // Place
    if (botMessage.includes("place")) {
      botMessage = await chatgptRequest(
        "gpt-3.5-turbo",
        "Strictly follow the format, and don't give any other information: Dialects: language1 (%),language2 (%),etc..",
        `Provide the top dialects spoken in ${userInput}, giving a maximum of 6, with a percentage estimate for how useful it would be to know this language when visiting`,
        key,
      );

      // Extracting Languages
      let languagesMatch = botMessage.match(/Dialects:\s*([^]+?)(?:\n\n|$)/);

      let languagesString = languagesMatch[1].trim();
      var language_list = languagesString.split(",").map((lang) => lang.trim());
      console.log(language_list);

      // Filtering Out Languages
      var language_list = language_list.filter(
        (item) => !item.toLowerCase().includes("language"),
      );
      const itemWith100Percent = language_list.find((item) =>
        item.includes("100%"),
      );
      if (itemWith100Percent) {
        language_list = [itemWith100Percent];
      }

      // More Than 1 Found
      if (language_list.length > 1) {
        let langChoiceInput = document.querySelector(".langchoice-input");

        // Remove existing grid if present
        let existingGrid = document.querySelector(".language-grid");
        if (existingGrid) {
          existingGrid.remove();
        }

        // Create a new div for the grid
        let gridDiv = document.createElement("div");
        gridDiv.classList.add("language-grid");
        gridDiv.style.display = "grid";
        gridDiv.style.gridTemplateColumns = "repeat(3, 1fr)";
        gridDiv.style.gap = "8px"; // Adjust gap between grid items if needed

        // Add each language to the grid in its own div
        language_list.forEach((language) => {
          let languageDiv = document.createElement("div");
          languageDiv.textContent = language;
          languageDiv.style.color = "var(--primary-color700)";
          languageDiv.style.backgroundColor = "white";
          languageDiv.style.fontSize = "14px";
          languageDiv.style.borderRadius = "var(--radius)";
          languageDiv.style.display = "flex";
          languageDiv.style.alignItems = "center";
          languageDiv.style.justifyContent = "center";
          languageDiv.style.padding = "14px 5vw"; // Adjust padding if needed
          languageDiv.style.cursor = "pointer";

          // Add onclick event listener
          languageDiv.onclick = () => {
            const flagSrc = getFlagUrl(country_code);
            selectLanguage(language.split("(")[0].trim(), flagSrc);
          };

          gridDiv.appendChild(languageDiv);
        });

        // Insert the grid div after the langchoice-input div
        langChoiceInput.insertAdjacentElement("afterend", gridDiv);

        // Extracting Country Code
        botMessage = await chatgptRequest(
          "gpt-3.5-turbo",
          "Strictly follow the format: Country Code: {country_code}",
          `Give ${userInput}'s country code in ISO 3166 format`,
          key,
        );
        country_code = botMessage.match(/Country Code:\s*([^,]*)/)[1].trim();
      } else {
        // 1 Language Found
        language = language_list[0];
        botMessage = await chatgptRequest(
          "gpt-3.5-turbo",
          "Strictly follow the format: Country Code: {country_code}",
          `Give ${userInput}'s country code in ISO 3166 format`,
          key,
        );
        country_code = botMessage.match(/Country Code:\s*([^,]*)/)[1].trim();
        const flagSrc = getFlagUrl(country_code);
        selectLanguage(language.split("(")[0].trim(), flagSrc);
      }
    }
  });
});

// Input Switching Logic

document.addEventListener("DOMContentLoaded", function () {
  const switchArrow = document.querySelector(
    '.translate-section img[alt="Switch Arrow"]',
  );
  const inputContainer1 = document.querySelector(".input-container.input1");
  const inputContainer2 = document.querySelector(".input-container.input2");

  // Set initial order values
  inputContainer1.style.order = 1;
  inputContainer2.style.order = 3;

  switchArrow.addEventListener("click", function () {
    // Apply translation effect
    inputContainer1.style.transform = "translateY(100%)";
    inputContainer2.style.transform = "translateY(-100%)";

    setTimeout(() => {
      // Swap the order properties
      const order1 = inputContainer1.style.order;
      inputContainer1.style.order = inputContainer2.style.order;
      inputContainer2.style.order = order1;

      // Reset the transform properties
      inputContainer1.style.transform = "";
      inputContainer2.style.transform = "";
    }, 300); // Match the CSS transition duration
  });
});

// Translation Code

const textInput1 = document.getElementById("text-input1");
const textInput2 = document.getElementById("text-input2");
const translateButton = document.querySelector(".translate-button");

async function translateText() {
  const language = box2.querySelector(".box-text").textContent;
  console.log(language);
  const text = document.getElementById("text-input1").textContent;

  // Check if the input box is empty
  if (!text.trim()) {
    textInput2.value = ""; // Clear the output box
    return; // Exit the function early
  }

  try {
    let { system, prompt } = await getPrompt(1);
    prompt = prompt
      .replace(/\${language}/g, language)
      .replace(/\${text}/g, text);

    // ChatGPT Request (Translation)
    const botMessage = await chatgptRequest("gpt-4", system, prompt, key);
    console.log(botMessage);
    var translation = botMessage.split("Translation:")[1].trim();
    console.log(translation);

    var translation_t = translation.split("[")[0].split("(")[0].trim();

    // Display the translation in the second input box
    textInput2.innerHTML = translation;

    // Call the function to adjust font size
    adjustFontSizeOfInputs();
  } catch (error) {
    console.error("Error:", error);
    textInput2.value =
      "Failed to connect. Please check your settings and try again.";
  }

  addTTS(translation_t);
}

function adjustFontSizeOfInputs() {
  var inputElements = document.querySelectorAll(".text-input");
  inputElements.forEach(function (inputElement) {
    handleInputEvent(inputElement);
  });
}

translateButton.addEventListener("click", translateText);

// Speech-To-Text

let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let stream;

async function startRecording() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();
    isRecording = true;
    document.getElementById("recordButton").src = "icons/stop.svg";

    mediaRecorder.addEventListener("dataavailable", (event) => {
      audioChunks.push(event.data);
    });

    mediaRecorder.addEventListener("stop", async () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("file", audioBlob, "speech.webm");
      formData.append("model", "whisper-1");

      try {
        const response = await fetch(
          "https://api.openai.com/v1/audio/transcriptions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
            },
            body: formData,
          },
        );
        console.log("Fetch response:", response);

        if (!response.ok) {
          const errorText = await response.text();
          console.log("Fetch response text:", errorText);
          throw new Error(
            `HTTP error! status: ${response.status}, response: ${errorText}`,
          );
        }

        const result = await response.json();
        console.log("Transcription result:", result);
        document.getElementById("text-input1").innerText = result.text;
      } catch (error) {
        console.error("Error during the fetch operation:", error);
      } finally {
        // Reset recording state
        isRecording = false;
        audioChunks = []; // Reset the audio chunks array
        document.getElementById("recordButton").src = "icons/microphone.svg";
        // Stop all tracks to release the microphone
        stream.getTracks().forEach((track) => track.stop());
      }
    });

    // Optional: Automatically stop recording after 6 seconds
    setTimeout(() => {
      if (isRecording) {
        stopRecording();
      }
    }, 6000);
  } catch (error) {
    console.error("Error accessing media devices:", error);
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;
    document.getElementById("recordButton").src = "icons/microphone.svg";
    // Stop all tracks to release the microphone
    stream.getTracks().forEach((track) => track.stop());
  }
}

function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

// Export function to make it accessible in HTML
window.toggleRecording = toggleRecording;

// TTS

async function addTTS(inputText) {
  console.log(inputText);
  const selectedVoice = "alloy";
  const selectedModel = "tts-1";
  const apiUrl = "https://api.openai.com/v1/audio/speech";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: selectedModel,
      voice: selectedVoice,
      input: inputText,
      format: "mp3",
    }),
  });

  const data = await response.blob();
  const audioUrl = URL.createObjectURL(data);
  const audioPlayer = document.getElementById("audioPlayer");
  audioPlayer.src = audioUrl;
}
