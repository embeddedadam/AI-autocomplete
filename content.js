chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action === "checkContentScript") {
      sendResponse({status: "ok"});
    } else if (request.action === "resetLearning") {
      resetLearning();
      sendResponse({status: "ok"});
    }
  }
);

let previousPrompts = [];
let currentInput = "";
let ngramModel = {};
let hideIndicatorTimeout;

function injectAutocompleteIndicator(inputElement) {
  const indicator = document.createElement('div');
  indicator.id = 'autocomplete-indicator';
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
  indicator.textContent = "Autocomplete available (Press Tab)";
  
  let container = inputElement.parentElement;
  while (container && window.getComputedStyle(container).position === 'static') {
    container = container.parentElement;
  }
  
  if (!container) {
    container = inputElement.parentElement;
    container.style.position = 'relative';
  }
  
  container.appendChild(indicator);
  return indicator;
}

function buildNgramModel(n = 3) {
  ngramModel = {};
  for (let prompt of previousPrompts) {
    const words = prompt.toLowerCase().split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) {
      const gram = words[i];
      const nextWord = words[i + 1];
      if (!ngramModel[gram]) {
        ngramModel[gram] = {};
      }
      ngramModel[gram][nextWord] = (ngramModel[gram][nextWord] || 0) + 1;
    }
    for (let i = 0; i < words.length - n; i++) {
      for (let j = 2; j <= n; j++) {
        const gram = words.slice(i, i + j).join(' ');
        const nextWord = words[i + j];
        if (!ngramModel[gram]) {
          ngramModel[gram] = {};
        }
        ngramModel[gram][nextWord] = (ngramModel[gram][nextWord] || 0) + 1;
      }
    }
  }
}

function predictNextWord(input) {
  const words = input.toLowerCase().split(/\s+/);
  let predictions = [];
  
  for (let n = 3; n >= 1; n--) {
    if (words.length >= n) {
      const gram = words.slice(-n).join(' ');
      if (ngramModel[gram]) {
        predictions = Object.entries(ngramModel[gram])
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(entry => entry[0]);
        if (predictions.length > 0) break;
      }
    }
  }
  
  return predictions;
}

function loadPreviousPrompts() {
  chrome.storage.local.get('previousPrompts', (result) => {
    previousPrompts = result.previousPrompts || [];
    buildNgramModel();
  });
}

function savePreviousPrompt(prompt) {
  if (prompt.trim() === '') {
    return;
  }
  previousPrompts.unshift(prompt);
  previousPrompts = [...new Set(previousPrompts)].slice(0, 1000);
  chrome.storage.local.set({ previousPrompts });
  buildNgramModel();
}

function resetLearning() {
  previousPrompts = [];
  chrome.storage.local.set({ previousPrompts });
  buildNgramModel();
}

function updateAutocompleteIndicator(inputElement, indicator) {
  clearTimeout(hideIndicatorTimeout);
  const predictions = predictNextWord(currentInput);
  if (predictions.length > 0) {
    indicator.textContent = `Next: ${predictions.join(' | ')}`;
    indicator.style.opacity = '1';
  } else {
    hideIndicatorTimeout = setTimeout(() => {
      indicator.style.opacity = '0';
    }, 500);
  }
}

function setupAutocomplete(inputElement) {
  const indicator = injectAutocompleteIndicator(inputElement);
  
  inputElement.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const predictions = predictNextWord(currentInput);
      if (predictions.length > 0) {
        const words = currentInput.split(/\s+/);
        const lastWord = words[words.length - 1];
        const completion = predictions[0].startsWith(lastWord.toLowerCase()) ? 
          predictions[0].slice(lastWord.length) : 
          ' ' + predictions[0];
        
        inputElement.textContent = currentInput + completion;
        currentInput = inputElement.textContent;
        
        // Place cursor at the end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(inputElement);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      updateAutocompleteIndicator(inputElement, indicator);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      savePreviousPrompt(currentInput);
      currentInput = '';
      updateAutocompleteIndicator(inputElement, indicator);
    }
  });

  inputElement.addEventListener('input', () => {
    currentInput = inputElement.textContent;
    updateAutocompleteIndicator(inputElement, indicator);
  });
}

function findInputElement() {
  let inputElement = document.querySelector('div[contenteditable="true"][translate="no"][enterkeyhint="enter"][tabindex="0"].ProseMirror');
  
  if (!inputElement) {
    inputElement = document.querySelector('textarea[placeholder="Send a message"]');
  }

  return inputElement;
}

function init() {
  loadPreviousPrompts();
  
  const inputElement = findInputElement();
  if (inputElement) {
    setupAutocomplete(inputElement);
  } else {
  }
}

if (window.location.hostname === 'chatgpt.com' || window.location.hostname === 'claude.ai') {
  init();
};

const observerConfig = { childList: true, subtree: true };
const observer = new MutationObserver((mutations, obs) => {
  const inputElement = findInputElement();
  if (inputElement && !inputElement.hasAutocomplete) {
    setupAutocomplete(inputElement);
    inputElement.hasAutocomplete = true;
  }
});

observer.observe(document.body, observerConfig);

const intervalId = setInterval(() => {
  const inputElement = findInputElement();
  if (inputElement) {
    if (!inputElement.hasAutocomplete) {
      setupAutocomplete(inputElement);
      inputElement.hasAutocomplete = true;
    }
    currentInput = inputElement.textContent;
    updateAutocompleteIndicator(inputElement, document.getElementById('autocomplete-indicator'));
  }
}, 1000);