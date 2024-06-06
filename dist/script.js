// Variables

const key = process.env.API_KEY;

// Reused Functions

async function getPrompt(promptNumber) {
  try {
    const response = await fetch("prompts.txt");
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const data = await response.text();
    const prompts = data.split("\n\n");

    if (promptNumber < 1 || promptNumber > prompts.length) {
      throw new Error(`Invalid prompt number: ${promptNumber}`);
    }

    const parts = prompts[promptNumber - 1].split(".");
    const prompt = parts.length > 1 ? parts.slice(1).join(".").trim() : "";
    return prompt;
  } catch (error) {
    throw new Error(`Error reading file: ${error.message}`);
  }
}

async function chatgptRequest(model, prompt) {
  console.log(prompt);
  const requestBody = JSON.stringify({
    model: model,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
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
  console.log("Response:", botMessage); // Log the full API response
  return botMessage;
}

// Input Boxes Click Radius

document.querySelector(".input1").addEventListener("click", function () {
  document.querySelector("#text-input1").focus();
});
document.querySelector(".input2").addEventListener("click", function () {
  document.querySelector("#text-input2").focus();
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

// Input Language Code

document.addEventListener("DOMContentLoaded", async () => {
  // Button Opacity
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

  // If Button Clicked
  const confirmArrow = document.querySelector(".confirm-arrow");
  confirmArrow.addEventListener("click", async () => {
    // Getting Language
    let prompt = await getPrompt(2);
    prompt = prompt.replace("${text}", inputField.value);
    const botMessage = await chatgptRequest("gpt-3.5-turbo", prompt);

    // Extracting Language + Country Code
    const parts = botMessage.split(/,/);
    let language, country_code;

    for (const part of parts) {
      if (part.includes("Language:")) {
        language = part.split("Language:")[1].trim();
      } else if (part.includes("Country:")) {
        country_code = part.split("Country:")[1].trim();
      }
    }

    // Getting Flag
    const flagSrc = country_code
      ? `https://flagsapi.com/${country_code}/flat/64.png`
      : "";
    console.log(flagSrc);

    if (inputField.value.trim() !== "") {
      selectLanguage(language, flagSrc);
    }
  });
});

function selectLanguage(language, flagSrc) {
  if (currentBox) {
    const box = document.getElementById(currentBox);
    let currentBoxId = currentBox.replace("box", "");

    console.log(currentBoxId);

    box.querySelector(".box-text").innerText = language;
    box.querySelector("img.flag").src = flagSrc;
    closeOverlay();
  }

  const languageLabel = document.querySelector(
    `.input-container.input${currentBox.replace("box", "")} .language-label`,
  );

  if (languageLabel) {
    languageLabel.innerText = language;
  }
}

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
    let prompt = await getPrompt(1);
    // Update the prompt to match user input
    prompt = prompt.replace("${language}", language).replace("${text}", text);

    // ChatGPT Request (Translation)
    const botMessage = await chatgptRequest("gpt-4", prompt);
    console.log(botMessage);
    var translation = botMessage.split("Translation:")[1].trim();
    console.log(translation);

    var translation_t = translation.split("[")[0];

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
    document.getElementById("recordButton").src = "icons/stop.svg"; // Update to your stop icon path

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

    // Optional: Automatically stop recording after 5 seconds
    setTimeout(() => {
      if (isRecording) {
        stopRecording();
      }
    }, 5000);
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
