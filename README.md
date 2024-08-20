# AI Chat Autocomplete

AI Chat Autocomplete is a Chrome extension that provides autocomplete functionality for ChatGPT and Claude based on the user's previous prompts. It learns from the user's input and suggests relevant completions as they type.

## Features

- Autocomplete suggestions based on previous prompts
- N-gram based prediction model (up to trigrams)
- Supports both ChatGPT and Claude AI chat interfaces
- Easy-to-use popup for managing permissions
- Automatically saves and loads prompts for a seamless experience

## Installation

1. Download or clone the repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable "Developer mode" in the top right corner.
4. Click on "Load unpacked" and select the directory containing the extension files.
5. The AI Chat Autocomplete extension should now be installed and active.

## Usage

1. Navigate to either [https://chatgpt.com](https://chatgpt.com) or [https://claude.ai](https://claude.ai) in your Chrome browser.
2. Start typing in the chat input field.
3. As you type, the extension will display autocomplete suggestions based on your previous prompts.
4. Press the Tab key to accept the top suggestion or continue typing to ignore the suggestions.
5. Press Enter to submit your prompt, which will be saved for future suggestions.

## Permissions

The extension requires the following permissions:

- `storage`: To save and load previous prompts.
- `activeTab`: To interact with the current tab and detect the chat interface.
- `tabs`: To send messages between the background script and content script.
- `https://chatgpt.com/*` and `https://claude.ai/*`: To run the content script on these specific websites.

You can manage the permissions by clicking on the extension icon in the Chrome toolbar and selecting "Grant Permissions" in the popup.

## Architecture

The extension consists of the following main components:

- `background.js`: The background script that manages the extension's lifecycle, permissions, and communication between the popup and content script.
- `content.js`: The content script that runs on the ChatGPT and Claude websites, implementing the autocomplete functionality and interacting with the chat interface.
- `popup.html` and `popup.js`: The popup UI and its associated script for managing permissions.
- `manifest.json`: The extension manifest file that defines the extension's configuration, permissions, and scripts.

## Contributing

Contributions to the AI Chat Autocomplete extension are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request on the [GitHub repository](https://github.com/yourusername/ai-chat-autocomplete).

## License

This project is licensed under the [MIT License](LICENSE).
