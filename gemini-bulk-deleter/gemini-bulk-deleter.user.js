// ==UserScript==
// @name         Gemini Sidebar Opener Maintainable + Load Conversations with Logging
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Opens the Gemini sidebar if collapsed, loads conversations, adds checkboxes, and deletes selected items. Includes detailed logging with prefixes.
// @match        https://gemini.google.com/app*
// @grant        GM_registerMenuCommand
// ==/UserScript==

(async function() {
    'use strict';

    // Helper function for sleep/delay
    function sleep(ms) {
        return new Promise(res => setTimeout(res, ms));
    }

    // Configuration constants
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

    let lastChecked = null;
    let conversationCheckboxStates = new Map();

    // Enhanced logging function with a prefix.
    function displayStatus(prefix, message) {
        console.log(`[${prefix}] ${message}`);
    }

    // Utility: Wait for an element matching the selector (returns a Promise)
    function waitForElement(selector, timeout) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            (function poll() {
                const el = document.querySelector(selector);
                if (el) {
                    console.log(`[WAIT] Element "${selector}" found after ${Date.now() - start}ms.`);
                    resolve(el);
                } else if (Date.now() - start < timeout) {
                    console.log(`[WAIT] Waiting for element "${selector}"... (${Date.now() - start}ms elapsed)`);
                    setTimeout(poll, CONFIG.pollInterval);
                } else {
                    reject(`[WAIT] Timeout waiting for element: ${selector} after ${timeout}ms.`);
                }
            })();
        });
    }

    // Utility: Ensure the DOM is fully loaded.
    function onDomReady() {
        return new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    console.log("[DOM] DOMContentLoaded event fired.");
                    resolve();
                });
            } else {
                console.log("[DOM] Document already loaded.");
                resolve();
            }
        });
    }

    // Utility: Log the state of the chat-history element.
    function logChatHistoryState(chatHistory) {
        console.log(`[SIDEBAR] Chat-history classes: ${chatHistory.className}`);
    }

    // Main function: Open the sidebar if it is collapsed.
    async function openSidebarIfCollapsed() {
        try {
            await onDomReady();
            displayStatus("SIDEBAR", "DOM is ready.");

            // Wait for the chat-history element.
            const chatHistory = await waitForElement(CONFIG.chatHistorySelector, CONFIG.chatHistoryTimeout);
            logChatHistoryState(chatHistory);

            // Wait additional time to let the page settle.
            displayStatus("SIDEBAR", `Waiting ${CONFIG.settleTime / 1000} seconds to let page settle...`);
            await sleep(CONFIG.settleTime);
            logChatHistoryState(chatHistory);

            // Only click the menu button if the sidebar is still collapsed.
            if (chatHistory.classList.contains('collapsed')) {
                displayStatus("SIDEBAR", "Sidebar is collapsed. Proceeding to open...");
                const menuButton = await waitForElement(CONFIG.menuButtonSelector, CONFIG.menuButtonTimeout);
                displayStatus("SIDEBAR", "Main menu button found with aria-describedby: " + menuButton.getAttribute('aria-describedby'));
                menuButton.click();
                displayStatus("SIDEBAR", "Main menu button clicked.");

                // Wait a short time and then log the updated state.
                await sleep(CONFIG.postClickDelay);
                logChatHistoryState(chatHistory);
            } else {
                displayStatus("SIDEBAR", "Sidebar is already open. No action taken.");
            }
        } catch (err) {
            console.error("[SIDEBAR] " + err);
        }
    }

    // Click the "More" button once to reveal conversations.
    async function clickMoreButtonOnce() {
        try {
            const moreButton = await waitForElement(CONFIG.moreButtonSelector, CONFIG.moreButtonTimeout);
            const labelElem = moreButton.querySelector('span.gds-body-m.show-more-button-text');
            if (labelElem) {
                const label = labelElem.textContent.trim();
                displayStatus("MORE", `More button label: "${label}"`);
                if (label === "Less") {
                    displayStatus("MORE", "More button is already clicked. Skipping click.");
                    return;
                }
            } else {
                console.warn("[MORE] Label element not found inside More button.");
            }
            displayStatus("MORE", "More button found. Clicking it once to load additional conversations.");
            moreButton.click();
            await sleep(CONFIG.postClickDelay);
            displayStatus("MORE", "More button clicked.");
        } catch (err) {
            console.error("[MORE] Error clicking More button: " + err);
        }
    }

    // Click "Load more" buttons repeatedly until none exist.
    async function clickLoadMoreButtons() {
        while (true) {
            const loadMoreButton = document.querySelector(CONFIG.loadMoreButtonSelector);
            if (loadMoreButton) {
                displayStatus("LOAD MORE", "Load more button found. Clicking it...");
                loadMoreButton.click();
                await sleep(CONFIG.postClickDelay);
            } else {
                displayStatus("LOAD MORE", "No more load more buttons found. Exiting load more loop.");
                break;
            }
        }
    }

    // Replace conversation icon with an advanced checkbox while preserving selection state.
    function addAdvancedCheckboxesToConversations() {
        const conversationContainers = document.querySelectorAll('.conversation-items-container');
        conversationContainers.forEach(container => {
            const conversationElem = container.querySelector('[data-test-id="conversation"]');
            if (!conversationElem) return;

            const titleElem = conversationElem.querySelector('.conversation-title');
            const titleKey = titleElem ? titleElem.textContent.trim() : "";

            let existingCheckbox = container.querySelector('input.tm-conversation-checkbox');
            if (existingCheckbox) {
                conversationCheckboxStates.set(titleKey, existingCheckbox.checked);
            } else {
                const iconElem = container.querySelector('.conversation-icon');
                if (iconElem) {
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.classList.add('tm-conversation-checkbox');
                    checkbox.style.marginRight = '5px';
                    checkbox.style.transform = 'scale(1.2)';

                    checkbox.addEventListener('click', function(e) {
                        e.stopPropagation();
                        if (e.shiftKey && lastChecked) {
                            const allCbs = Array.from(document.querySelectorAll('.tm-conversation-checkbox'));
                            const start = allCbs.indexOf(lastChecked);
                            const end = allCbs.indexOf(checkbox);
                            const [min, max] = [Math.min(start, end), Math.max(start, end)];
                            console.log(`[CHECKBOX] Shift-click: Inverting checkboxes from ${min + 1} to ${max - 1}.`);
                            for (let i = min + 1; i < max; i++) {
                                allCbs[i].checked = !allCbs[i].checked;
                                const convTitle = allCbs[i].closest('[data-test-id="conversation"]')
                                    ?.querySelector('.conversation-title')?.textContent.trim();
                                if (convTitle) conversationCheckboxStates.set(convTitle, allCbs[i].checked);
                            }
                        }
                        lastChecked = checkbox;
                        conversationCheckboxStates.set(titleKey, checkbox.checked);
                        displayStatus("CHECKBOX", `Checkbox clicked for "${titleKey}". State: ${checkbox.checked}`);
                    });

                    iconElem.parentNode.replaceChild(checkbox, iconElem);
                    if (conversationCheckboxStates.has(titleKey)) {
                        checkbox.checked = conversationCheckboxStates.get(titleKey);
                    }
                    displayStatus("CHECKBOX", `Checkbox added for conversation: ${titleKey}`);
                }
            }
        });
    }

    async function deleteConversation(conversationElem) {
        try {
            console.log(`[DELETION] Deleting conversation: ${conversationElem.innerText.trim()}`);
            const container = conversationElem.closest('.conversation-items-container');
            if (!container) {
                console.error("[DELETION] Conversation container not found.");
                return;
            }
            const actionsButton = container.querySelector('button[data-test-id="actions-menu-button"]');
            if (!actionsButton) {
                console.error("[DELETION] Actions menu button not found in container.");
                return;
            }
            actionsButton.click();
            console.log("[DELETION] Actions menu button clicked.");

            const menuContent = await waitForElement('.mat-mdc-menu-content', 5000);
            if (!menuContent) {
                console.error("[DELETION] Menu content not found.");
                return;
            }
            const deleteButton = menuContent.querySelector('button[data-test-id="delete-button"]');
            if (!deleteButton) {
                console.error("[DELETION] Delete button not found in menu.");
                return;
            }
            deleteButton.click();
            console.log("[DELETION] Delete button clicked.");

            const confirmButton = await waitForElement('button[data-test-id="confirm-button"]', 5000);
            if (!confirmButton) {
                console.error("[DELETION] Confirm button not found.");
                return;
            }
            await sleep(250);
            confirmButton.click();
            console.log("[DELETION] Confirm button clicked.");

            await sleep(250);
            console.log("[DELETION] Conversation deletion should be complete.");
        } catch (err) {
            console.error("[DELETION] Error deleting conversation:", err);
        }
    }

    async function deleteSelectedConversations() {
        while (true) {
            const checkbox = document.querySelector('.tm-conversation-checkbox:checked');
            if (!checkbox) {
                console.log("[DELETION] No more selected conversations found.");
                break;
            }
            const conv = checkbox.closest('[data-test-id="conversation"]');
            if (!conv) {
                console.error("[DELETION] Conversation element not found for a selected checkbox.");
                break;
            }
            await deleteConversation(conv);
            await sleep(250);
            addAdvancedCheckboxesToConversations();
        }
    }

    // Initialization function that runs all steps sequentially with status messages.
    async function initializeConversations() {
        try {
            displayStatus("INIT", "Step 1: Opening sidebar...");
            await openSidebarIfCollapsed();
            displayStatus("INIT", "Step 2: Clicking 'More' button...");
            await clickMoreButtonOnce();
            displayStatus("INIT", "Step 3: Clicking 'Load more' buttons...");
            await clickLoadMoreButtons();
            displayStatus("INIT", "Step 4: Adding checkboxes to conversations...");
            addAdvancedCheckboxesToConversations();
            displayStatus("INIT", "Initialization complete. Conversations loaded and checkboxes added.");
        } catch (err) {
            console.error("[INIT] Initialization error:", err);
            displayStatus("INIT", "Initialization error: " + err);
        }
    }

    // Instead of auto-execution, use Tampermonkey menu commands for manual control.
    GM_registerMenuCommand("Initialize Conversations", initializeConversations);
    GM_registerMenuCommand("Delete Selected Conversations", deleteSelectedConversations);

})();
