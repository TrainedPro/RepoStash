# AI Studio Bulk Deleter UserScript

This is a TamperMonkey/ViolentMonkey UserScript that enhances the Google AI Studio Library page (`aistudio.google.com/library`) by adding features for bulk deleting prompts (chats).

## Features

*   **Checkboxes:** Adds a checkbox next to each prompt in the library list.
*   **Bulk Deletion:** Adds a "Delete Selected" button to delete all checked prompts.
    *   Includes a confirmation prompt before deletion.
    *   Handles dynamic UI updates during deletion (finds items by name).
    *   Provides status updates during the process.
*   **Selection Helpers:**
    *   **Invert Selection:** Button to toggle the checked state of all currently visible checkboxes.
    *   **Shift-Click Range Selection:** Click a checkbox, then hold Shift and click another checkbox to select/deselect the range between them.
*   **Checkbox Refresh:** Adds a "Refresh Checkboxes" button to manually re-apply checkboxes if they disappear due to scrolling (common with virtual scrolling lists).
*   **Themed UI:** Control panel and buttons use AI Studio's CSS variables for a native look and feel (works best with dark theme).

## Prerequisites

1.  A web browser (e.g., Chrome, Firefox, Edge).
2.  A UserScript manager browser extension:
    *   [Tampermonkey](https://www.tampermonkey.net/) (Recommended)
    *   [Violentmonkey](https://violentmonkey.github.io/)
    *   (Other managers like Greasemonkey might work but are less tested with modern scripts).

## Installation

1.  **Install a UserScript Manager:** If you don't have one, install Tampermonkey or Violentmonkey from your browser's extension store.
2.  **Install the Script:** Click the link below (requires the manager extension to be active):
    *   **[Install ai-studio-bulk-chat-deleter.user.js](https://github.com/TrainedPro/RepoStash/aistudio-bulk-deleter-userscript/raw/main/ai-studio-bulk-chat-deleter.user.js)**
3.  **Confirm Installation:** Your UserScript manager should pop up and ask you to confirm the installation. Review the permissions (it should only need access to `aistudio.google.com/library`) and click "Install".

*Alternatively:*

1.  Open your UserScript manager dashboard.
2.  Create a new script.
3.  Copy the entire content of the `ai-studio-bulk-chat-deleter.user.js` file from this repository.
4.  Paste the code into the new script editor in your manager.
5.  Save the script.

## Usage

1.  **Navigate:** Go to your AI Studio Library page: [https://aistudio.google.com/library](https://aistudio.google.com/library)
2.  **Wait:** Allow a few seconds for the script to initialize. You should see a new control panel appear above the list of prompts.
3.  **Select Prompts:**
    *   Click the checkboxes next to the prompts you want to delete.
    *   Use **Shift + Click** to select a range of prompts.
    *   Use the **"Invert Selection"** button to toggle all currently visible checkboxes.
4.  **Delete:** Click the **"Delete Selected"** button.
5.  **Confirm:** A browser confirmation dialog will ask if you're sure. Click "OK" to proceed.
6.  **Monitor:** Watch the status display in the control panel for progress updates. The script will process items one by one with delays to ensure stability.
7.  **Refresh Checkboxes (If Needed):** If you scroll down a long list and checkboxes disappear from newly loaded rows, click the **"Refresh Checkboxes"** button.