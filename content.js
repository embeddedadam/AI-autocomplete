(() => {
  const DEBUG = false;
  const CHATGPT_TEXTAREA_SELECTOR =
    'textarea#prompt-textarea[placeholder="Message ChatGPT"]';
  const CLAUDE_CONTENTEDITABLE_SELECTOR = '[contenteditable="true"]';

  function log(...args) {
    if (DEBUG) {
      console.log("[AutoComplete Extension]", ...args);
    }
  }

  function handleError(error) {
    if (error === chrome.runtime.lastError) {
      log("Chrome runtime error:", error.message);
    } else {
      log("Error:", error);
    }
  }

  function isExtensionContextValid() {
    try {
      return chrome.runtime && !!chrome.runtime.id;
    } catch (e) {
      return false;
    }
  }

  function initializeExtension() {
    if (!isExtensionContextValid()) {
      log("Extension context is invalid. Exiting...");
      return;
    }

    let previousPrompts = [];
    let currentInput = "";
    let ngramModel = {};
    let promptHistoryIndex = -1;
    let tempInput = "";

    chrome.storage.local.get("previousPrompts", (result) => {
      try {
        previousPrompts = result.previousPrompts || [];
        log("Loaded previous prompts:", previousPrompts);
        buildNgramModel();
      } catch (error) {
        handleError(error);
      }
    });

    function buildNgramModel(n = 3) {
      ngramModel = {};
      for (let prompt of previousPrompts) {
        const words = prompt.toLowerCase().split(/\s+/);
        for (let i = 0; i < words.length - n + 1; i++) {
          for (let j = 1; j <= n; j++) {
            const gram = words.slice(i, i + j).join(" ");
            const nextWord = words[i + j];
            if (nextWord) {
              // Only add if nextWord exists
              if (!ngramModel[gram]) {
                ngramModel[gram] = {};
              }
              ngramModel[gram][nextWord] =
                (ngramModel[gram][nextWord] || 0) + 1;
            }
          }
        }
      }
      log("Built n-gram model:", ngramModel);
    }

    function predictNextWord(input) {
      const words = input.toLowerCase().split(/\s+/);
      let predictions = [];

      for (let n = 3; n >= 1; n--) {
        if (words.length >= n) {
          const gram = words.slice(-n).join(" ");
          if (ngramModel[gram]) {
            predictions = Object.entries(ngramModel[gram])
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map((entry) => entry[0])
              .filter((word) => word && word !== "null");
            if (predictions.length > 0) {
              break;
            }
          }
        }
      }

      return predictions;
    }

    function savePreviousPrompt(prompt) {
      if (prompt.trim() === "") {
        return;
      }
      previousPrompts.unshift(prompt);
      previousPrompts = [...new Set(previousPrompts)].slice(0, 1000);
      chrome.storage.local.set({ previousPrompts }, () => {
        if (chrome.runtime.lastError) {
          handleError(chrome.runtime.lastError);
        } else {
          log("Saved prompt:", prompt);
          log("Updated previousPrompts:", previousPrompts);
          buildNgramModel();
        }
      });
    }

    function resetLearning() {
      previousPrompts = [];
      chrome.storage.local.set({ previousPrompts }, () => {
        if (chrome.runtime.lastError) {
          handleError(chrome.runtime.lastError);
        } else {
          log("Reset learning. Cleared all previous prompts.");
          buildNgramModel();
        }
      });
    }

    function setupAutocomplete(inputElement) {
      log("Setting up autocomplete for:", inputElement);
      const indicator = document.createElement("div");
      indicator.id = "autocomplete-indicator";
      indicator.style.cssText = `
        position: absolute;
        top: -40px;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 5px;
        font-size: 14px;
        z-index: 10000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease-in-out;
        text-align: center;
        font-weight: bold;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      `;

      if (inputElement.getAttribute("contenteditable") === "true") {
        const container = inputElement.closest(".chat-input-panel");
        if (container) {
          container.style.position = "relative";
          container.insertBefore(indicator, container.firstChild);
        } else {
          inputElement.parentElement.insertBefore(indicator, inputElement);
        }
      } else {
        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";
        inputElement.parentNode.insertBefore(wrapper, inputElement);
        wrapper.appendChild(inputElement);
        wrapper.appendChild(indicator);
      }

      let hideIndicatorTimeout;

      function updateIndicator(predictions) {
        clearTimeout(hideIndicatorTimeout);
        if (predictions.length > 0) {
          indicator.textContent = `Next: ${predictions.join(" | ")}`;
          indicator.style.opacity = "1";
          log("Showing predictions:", predictions);
        } else {
          hideIndicatorTimeout = setTimeout(() => {
            indicator.style.opacity = "0";
          }, 500);
          log("No predictions available");
        }
      }

      function updateInputContent(content) {
        if (inputElement.tagName.toLowerCase() === "textarea") {
          inputElement.value = content;
          inputElement.dispatchEvent(new Event("input", { bubbles: true }));
          inputElement.style.height = "auto";
          inputElement.style.height = inputElement.scrollHeight + "px";
        } else {
          inputElement.textContent = content;
          inputElement.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }

      function getInputContent() {
        return inputElement.tagName.toLowerCase() === "textarea"
          ? inputElement.value
          : inputElement.textContent;
      }

      function setCaretToEnd() {
        if (inputElement.tagName.toLowerCase() === "textarea") {
          inputElement.setSelectionRange(
            inputElement.value.length,
            inputElement.value.length,
          );
        } else {
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(inputElement);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }

      function handleInput() {
        currentInput = getInputContent();
        log("Input changed:", currentInput);
        updateIndicator(predictNextWord(currentInput));
      }

      function handleKeyDown(e) {
        if (e.key === "Tab") {
          e.preventDefault();
          const predictions = predictNextWord(currentInput);
          if (predictions.length > 0) {
            const words = currentInput.split(/\s+/);
            const lastWord = words[words.length - 1];
            const completion = predictions[0].startsWith(lastWord.toLowerCase())
              ? predictions[0].slice(lastWord.length)
              : " " + predictions[0];

            updateInputContent(currentInput + completion);
            currentInput = getInputContent();
            setCaretToEnd();
          }
          updateIndicator(predictNextWord(currentInput));
        } else if (e.key === "Enter" && !e.shiftKey) {
          savePreviousPrompt(currentInput);
          promptHistoryIndex = -1;
          tempInput = "";
          currentInput = "";
          updateIndicator([]);
        } else if (e.key === "ArrowUp") {
          if (promptHistoryIndex === -1) {
            tempInput = currentInput;
          }
          if (promptHistoryIndex < previousPrompts.length - 1) {
            e.preventDefault();
            promptHistoryIndex++;
            currentInput = previousPrompts[promptHistoryIndex];
            updateInputContent(currentInput);
            setCaretToEnd();
          }
        } else if (e.key === "ArrowDown") {
          if (promptHistoryIndex > -1) {
            e.preventDefault();
            promptHistoryIndex--;
            if (promptHistoryIndex === -1) {
              currentInput = tempInput;
            } else {
              currentInput = previousPrompts[promptHistoryIndex];
            }
            updateInputContent(currentInput);
            setCaretToEnd();
          }
        }
      }

      inputElement.addEventListener("input", handleInput);
      inputElement.addEventListener("keydown", handleKeyDown);
    }

    function findAndSetupInputElement() {
      log("Searching for input element...");
      const chatGPTInput = document.querySelector(CHATGPT_TEXTAREA_SELECTOR);
      const claudeInput = document.querySelector(
        CLAUDE_CONTENTEDITABLE_SELECTOR,
      );

      const inputElement = chatGPTInput || claudeInput;

      if (inputElement && !inputElement.hasAutocomplete) {
        log("Input element found:", inputElement);
        setupAutocomplete(inputElement);
        inputElement.hasAutocomplete = true;
        return true;
      }

      return false;
    }

    // Use MutationObserver to watch for the input element
    const observer = new MutationObserver((mutations) => {
      if (!isExtensionContextValid()) {
        observer.disconnect();
        return;
      }
      if (findAndSetupInputElement()) {
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Attempt to find the input element immediately
    if (!findAndSetupInputElement()) {
      log("Input element not found initially. Waiting for DOM changes...");
    }

    // Add a delayed search for the input element
    setTimeout(() => {
      if (!findAndSetupInputElement()) {
        log("Input element not found after delay. Waiting for DOM changes...");
      }
    }, 1000); // 1 second delay

    // Listen for messages from the background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (!isExtensionContextValid()) {
        return;
      }
      if (request.action === "resetLearning") {
        resetLearning();
        sendResponse({ status: "ok" });
      }
    });
  }

  // Start the extension
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeExtension);
  } else {
    initializeExtension();
  }
})();
