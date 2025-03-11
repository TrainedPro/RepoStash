# Gemini Bulk Deleter

A Tampermonkey user script for [Gemini](https://gemini.google.com/app) that:
- Opens the sidebar if collapsed.
- Clicks the "More" button and any "Load more" buttons to load all conversations.
- Replaces conversation icons with advanced checkboxes (with shift-click selection support).
- Allows deletion of selected conversations through a menu command.

## Features

- **Sidebar Management:** Automatically opens the sidebar if it is collapsed.
- **Conversation Loading:** Clicks the "More" button once and then repeatedly clicks "Load more" buttons until all conversations are loaded.
- **Advanced Checkboxes:** Replaces conversation icons with checkboxes that support shift-click for range selection.
- **Deletion Functionality:** Delete selected conversations by clicking a menu command in Tampermonkey.
- **Detailed Logging:** Console logging with prefixes for easy debugging and delay tuning.

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) in your browser.
2. Click the **"Initialize Conversations"** menu command in Tampermonkey to load the sidebar and add checkboxes.
3. Use the **"Delete Selected Conversations"** menu command to delete any conversations that you have checked.

## Usage

- **Initialize Conversations:**  
  This command will open the sidebar (if collapsed), load all conversations by clicking "More" and "Load more" buttons, and then add advanced checkboxes to each conversation.
  
- **Delete Selected Conversations:**  
  Select the conversations you wish to delete using the checkboxes. Then, run this command from the Tampermonkey menu to delete them one by one.

## Configuration

The script includes a configuration object (`CONFIG`) that allows you to tweak delays and polling intervals:

```js
const CONFIG = {
    chatHistorySelector: '.chat-history',
    menuButtonSelector: 'button[data-test-id="side-nav-menu-button"]',
    moreButtonSelector: 'button[data-test-id="show-more-button"]',
    loadMoreButtonSelector: 'button[data-test-id="load-more-button"]',
    chatHistoryTimeout: 20000,      // Maximum time to wait for the chat-history element.
    menuButtonTimeout: 10000,       // Maximum time to wait for the menu button.
    moreButtonTimeout: 10000,       // Maximum time to wait for the More button.
    pollInterval: 250,              // Polling interval in milliseconds.
    settleTime: 2000,               // Settling time for the sidebar.
    postClickDelay: 2000            // Delay after clicks.
};
