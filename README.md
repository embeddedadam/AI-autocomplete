# AI Chat Autocomplete

AI Chat Autocomplete is a Chrome extension that provides intelligent autocomplete functionality for ChatGPT and Claude AI interfaces. It learns from the user's input and suggests relevant completions as they type, enhancing the chat experience and improving efficiency.

## Features

- Intelligent autocomplete suggestions based on previous prompts
- N-gram based prediction model (up to trigrams) for more accurate suggestions
- Supports both ChatGPT and Claude AI chat interfaces
- Adaptive positioning of autocomplete suggestions for different chat layouts
- Keyboard navigation for prompt history (up/down arrow keys)
- Tab key completion for quick input of suggestions
- Automatically saves and loads prompts for a seamless experience
- Debug mode for easier troubleshooting and development

## Installation

1. Download or clone the repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable "Developer mode" in the top right corner.
4. Click on "Load unpacked" and select the directory containing the extension files.
5. The AI Chat Autocomplete extension should now be installed and active.

## Usage

1. Navigate to either [https://chat.openai.com](https://chat.openai.com) (ChatGPT) or [https://claude.ai](https://claude.ai) (Claude) in your Chrome browser.
2. Start typing in the chat input field.
3. As you type, the extension will display autocomplete suggestions above the input field.
4. Press the Tab key to accept the top suggestion, or continue typing to ignore the suggestions.
5. Use the up and down arrow keys to navigate through your prompt history.
6. Press Enter to submit your prompt, which will be saved for future suggestions.

## Permissions

The extension requires the following permissions:

- `storage`: To save and load previous prompts.
- `activeTab`: To interact with the current tab and detect the chat interface.
- `https://chat.openai.com/*` and `https://claude.ai/*`: To run the content script on these specific websites.

## Architecture

The extension consists of the following main components:

- `content.js`: The core script that runs on the ChatGPT and Claude websites, implementing the autocomplete functionality and interacting with the chat interface.
- `manifest.json`: The extension manifest file that defines the extension's configuration, permissions, and scripts.

### Key Functions in content.js

- `buildNgramModel`: Constructs an n-gram model from previous prompts for prediction.
- `predictNextWord`: Uses the n-gram model to predict the next word based on input.
- `setupAutocomplete`: Sets up the autocomplete functionality for the input element.
- `updateIndicator`: Updates the autocomplete suggestion display.
- `handleInput` and `handleKeyDown`: Manage user input and keyboard interactions.
- `findAndSetupInputElement`: Locates and initializes the chat input element.

## Development

To work on this extension:

1. Clone the repository.
2. Make changes to the `content.js` file as needed.
3. To enable debug logging, set `const DEBUG = true;` at the top of `content.js`.
4. Load the extension in Chrome as an unpacked extension for testing.
5. Refresh the extension and the target pages after making changes.

## Contributing

Contributions to the AI Chat Autocomplete extension are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request on the GitHub repository.

## License

This project is licensed under the MIT License.
