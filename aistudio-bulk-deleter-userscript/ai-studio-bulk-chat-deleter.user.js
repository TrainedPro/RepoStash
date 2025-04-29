// ==UserScript==
// @name         AI Studio Bulk Chat Deleter
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Adds checkboxes, bulk deletion, selection helpers (invert, shift-click), and themed UI controls to the AI Studio Library page (aistudio.google.com/library) for managing prompts. Handles dynamic list updates.
// @author       Your Name / AI Collaboration
// @match        https://aistudio.google.com/library
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // --- Configuration Constants ---
    const SCRIPT_PREFIX = '[AIStudioDeleter]'; // Prefix for console log messages
    const INITIAL_DELAY_MS = 2048; // Initial delay (ms) before the script fully initializes after page load
    const ELEMENT_WAIT_TIMEOUT_MS = 15000; // Max time (ms) to wait for dynamic elements to appear
    const ACTION_DELAY_MS = 600; // Base delay (ms) between clicks/actions within a single deletion process
    const INTER_ITEM_DELAY_MS = 1500; // Delay (ms) *between* deleting different items in a bulk operation
    const POST_DELETE_REFRESH_DELAY = 300; // Short delay (ms) after bulk delete before refreshing checkboxes
    const CHECKBOX_SCALE_FACTOR = 1.6; // Visual scaling factor for checkboxes

    // --- Selectors ---
    const SECTION_VIEW_SELECTOR = 'section.lib-view'; // Main container for the library view
    const TABLE_WRAPPER_SELECTOR = 'div.lib-table-wrapper'; // Div containing the prompts table
    const ITEM_ROW_SELECTOR = 'tbody tr.mat-mdc-row'; // Selector for each prompt row (TR element)
    const ITEM_NAME_SELECTOR = 'td.mat-column-name button.name-btn'; // Selector for the button containing the prompt name within a row
    const THREE_DOTS_BUTTON_SELECTOR = 'button.overflow-button'; // Selector for the 3-dots menu button within a row
    const MENU_PANEL_SELECTOR = 'div.mat-mdc-menu-panel'; // Selector for the menu panel that appears after clicking 3-dots
    const DELETE_MENU_ITEM_SELECTOR = 'button.mat-mdc-menu-item'; // Selector for items within the 3-dots menu
    const CONFIRM_DIALOG_PANEL_SELECTOR = 'div.cdk-overlay-pane.gmat-mdc-dialog'; // Selector for the confirmation dialog panel
    const FINAL_DELETE_BUTTON_SELECTOR = 'mat-dialog-actions button.mat-primary'; // Selector for the final 'Delete' button in the confirmation dialog

    // --- CSS Classes and IDs ---
    const CHECKBOX_CLASS = 'aistudio-deleter-checkbox'; // CSS class for injected checkboxes
    const PANEL_ID = 'aiStudioDeleterControlPanel'; // ID for the main control panel
    const STATUS_ID = 'aistudioDeleterStatus'; // ID for the status display element
    const DELETE_BTN_ID = 'aistudioDeleteSelectedBtn'; // ID for the 'Delete Selected' button
    const INVERT_BTN_ID = 'aistudioInvertSelectionBtn'; // ID for the 'Invert Selection' button
    const REFRESH_BTN_ID = 'aistudioRefreshCheckboxesBtn'; // ID for the 'Refresh Checkboxes' button

    // --- Runtime State ---
    let statusDisplay = null; // Reference to the status display DOM element
    let lastChecked = null; // Reference to the last checkbox clicked without Shift, for range selection

    // --- Utility Functions ---

    /**
     * Logs messages to the console with a script-specific prefix.
     * @param {string} message - The message to log.
     */
    function log(message) {
        console.log(`${SCRIPT_PREFIX} ${message}`);
    }

    /**
     * Displays a status message to the user both in the UI panel and the console.
     * @param {string} message - The message to display.
     */
    function displayStatus(message) {
        log(message);
        if (statusDisplay) {
            statusDisplay.textContent = message;
        } else {
            // Fallback if the status element isn't ready or failed to initialize
            console.warn(`${SCRIPT_PREFIX} Status display element not found yet for message: ${message}`);
        }
    }

    /**
     * Waits for a specific element to appear in the DOM.
     * @param {string} selector - The CSS selector for the element.
     * @param {number} timeout - Maximum time (ms) to wait.
     * @param {Element} [baseElement=document] - The base element to search within (defaults to document).
     * @returns {Promise<Element|null>} A promise resolving with the found element, or null if timed out.
     */
    function waitForElement(selector, timeout, baseElement = document) {
        return new Promise((resolve) => {
            log(`Waiting for element: ${selector} (timeout: ${timeout}ms)`);
            const intervalTime = 200; // How often to check
            let timeWaited = 0;
            const interval = setInterval(() => {
                const element = baseElement.querySelector(selector);
                timeWaited += intervalTime;
                if (element) {
                    log(`Element found: ${selector}`);
                    clearInterval(interval);
                    resolve(element);
                } else if (timeWaited >= timeout) {
                    log(`Timeout waiting for element: ${selector}`);
                    clearInterval(interval);
                    resolve(null); // Resolve with null on timeout
                }
            }, intervalTime);
        });
    }

    /**
     * Creates a pause for a specified duration.
     * @param {number} ms - Duration of the delay in milliseconds.
     * @returns {Promise<void>} A promise that resolves after the delay.
     */
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Finds a table row in the *current* DOM based on the prompt name displayed within it.
     * Crucial for handling dynamic table updates where row elements are replaced.
     * @param {string} name - The exact name of the prompt to find.
     * @returns {Element | null} The TR element if found, otherwise null.
     */
    function findRowByName(name) {
        log(`Searching for current row with name: "${name}"`);
        const allCurrentRows = document.querySelectorAll(ITEM_ROW_SELECTOR);
        for (const row of allCurrentRows) {
            const nameElement = row.querySelector(ITEM_NAME_SELECTOR);
            // Ensure the name element exists and its trimmed text content matches exactly
            if (nameElement && nameElement.textContent.trim() === name) {
                log(`Found current row for "${name}".`);
                return row;
            }
        }
        log(`Could not find current row for "${name}" in the table.`);
        return null;
    }

    // --- Styling ---

    /**
     * Injects CSS styles into the document head to theme the UI components
     * using the site's CSS variables for a more native look.
     */
    function injectStyles() {
        const css = `
            /* Main control panel container */
            #${PANEL_ID} {
                background-color: var(--color-surface-container, #1e2022); /* Use site variable with fallback */
                border: 1px solid var(--color-outline-variant, rgba(255,255,255,0.12));
                padding: 12px 16px;
                margin-bottom: 16px;
                border-radius: 12px;
                color: var(--color-on-surface, #e2e2e5);
                box-shadow: var(--shadow-tchotchke, 0px 1px 3px 1px rgba(0,0,0,0.1),0px 1px 8px 0px rgba(0,0,0,0.2));
            }

            /* Button container within the panel */
            #${PANEL_ID} > div:first-of-type {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
                margin-bottom: 10px;
            }

            /* General button styling */
            #${PANEL_ID} button {
                background-color: var(--color-surface-container-high, #282a2d);
                color: var(--color-on-surface, #e2e2e5);
                border: 1px solid var(--color-outline-variant, rgba(255,255,255,0.12));
                padding: 6px 16px;
                border-radius: 18px; /* Pill shape */
                cursor: pointer;
                font-size: 0.875rem; /* ~14px */
                font-weight: 500;
                transition: background-color 0.2s ease;
                line-height: 1.25rem;
                height: 36px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                white-space: nowrap; /* Prevent wrapping */
            }

            /* Button hover state */
            #${PANEL_ID} button:hover:not(:disabled) {
                background-color: var(--color-surface-container-highest, #333537);
            }

            /* Button disabled state */
            #${PANEL_ID} button:disabled {
                background-color: var(--color-run-button-disabled-background-transparent, rgba(226,226,229,0.12));
                color: var(--color-on-surface-variant, #a8abb4);
                border-color: transparent;
                cursor: not-allowed;
                opacity: 0.7;
            }

            /* Specific button alignment */
            #${REFRESH_BTN_ID} {
               margin-left: auto; /* Push refresh button to the right */
            }

            /* Status display text */
            #${STATUS_ID} {
                font-size: 0.85em;
                color: var(--color-on-surface-variant, #a8abb4);
                margin-top: 8px;
                font-style: italic;
            }

            /* Checkbox styling */
            .${CHECKBOX_CLASS} {
                margin-right: 8px !important; /* Ensure spacing, use !important to override potential site styles */
                vertical-align: middle !important;
                transform: scale(${CHECKBOX_SCALE_FACTOR}) !important; /* Make checkbox larger */
                accent-color: var(--color-primary, #87a9ff); /* Use theme color for the checkmark */
                cursor: pointer;
            }
        `;
        const styleElement = document.createElement('style');
        styleElement.id = `${SCRIPT_PREFIX}-styles`; // Give the style element an ID
        styleElement.textContent = css;
        document.head.appendChild(styleElement);
        log("Injected custom styles.");
    }


    // --- Core Logic Functions ---

    /**
     * Creates and injects the control panel UI elements into the page.
     * Styling is applied via injected CSS (injectStyles).
     */
    function addControls() {
        log("Attempting to add controls...");
        const targetSection = document.querySelector(SECTION_VIEW_SELECTOR);
        if (!targetSection) { log(`Error: Target section ('${SECTION_VIEW_SELECTOR}') not found.`); return; }
        const tableWrapper = targetSection.querySelector(TABLE_WRAPPER_SELECTOR);
        if (!tableWrapper) { log(`Error: Table wrapper ('${TABLE_WRAPPER_SELECTOR}') not found within section.`); return; }
        log("Target section and table wrapper found.");

        // Prevent adding multiple panels if script runs again
        if (document.getElementById(PANEL_ID)) {
            log("Control panel already exists.");
            statusDisplay = document.getElementById(STATUS_ID); // Re-link global state variable
            return;
        }
        log("Control panel does not exist yet. Creating...");

        // Create elements programmatically (more robust than innerHTML)
        const panel = document.createElement('div');
        panel.id = PANEL_ID;

        const buttonContainer = document.createElement('div'); // Container for layout

        const deleteBtn = document.createElement('button');
        deleteBtn.id = DELETE_BTN_ID;
        deleteBtn.textContent = 'Delete Selected';

        const invertBtn = document.createElement('button');
        invertBtn.id = INVERT_BTN_ID;
        invertBtn.textContent = 'Invert Selection';

        const refreshBtn = document.createElement('button');
        refreshBtn.id = REFRESH_BTN_ID;
        refreshBtn.textContent = 'Refresh Checkboxes';
        refreshBtn.title = 'Add checkboxes to rows missing them (e.g., after scrolling)';

        buttonContainer.appendChild(deleteBtn);
        buttonContainer.appendChild(invertBtn);
        buttonContainer.appendChild(refreshBtn);

        const statusDiv = document.createElement('div');
        statusDiv.id = STATUS_ID;
        statusDiv.textContent = 'Initializing...';

        panel.appendChild(buttonContainer);
        panel.appendChild(statusDiv);

        // Insert the panel into the DOM before the table wrapper
        try {
            targetSection.insertBefore(panel, tableWrapper);
            log("Control panel inserted into DOM.");

            // Verify insertion and link the statusDisplay variable
            const insertedPanel = document.getElementById(PANEL_ID);
            if (insertedPanel) {
                statusDisplay = insertedPanel.querySelector(`#${STATUS_ID}`);
                if (statusDisplay) {
                    log("Status display element linked.");
                    displayStatus("Controls added. Adding checkboxes...");
                } else {
                    log("Error: Status display element not found within inserted panel!");
                }
                log("Control panel added successfully.");
            } else {
                // This case should ideally not happen if insertBefore succeeded without error
                log("Error: Panel element not found immediately after insertion attempt.");
                statusDisplay = null;
            }
        } catch (error) {
            log(`Error during panel insertion: ${error}`);
            console.error(error);
            statusDisplay = null; // Ensure state reflects failure
        }
    }

    /**
     * Adds checkboxes to visible table rows if they don't already have one.
     * Handles shift-click range selection.
     * Necessary after initial load, scrolling (due to virtual scroll), and deletions.
     */
    function addCheckboxes() {
        log("Attempting to add/refresh checkboxes...");
        const itemRows = document.querySelectorAll(ITEM_ROW_SELECTOR);
        if (!itemRows || itemRows.length === 0) {
            log("No item rows found to add checkboxes to.");
            // Avoid overwriting important status messages like "Deletion complete"
            return;
        }
        log(`Found ${itemRows.length} item rows. Checking/Adding checkboxes...`);
        let checkboxesAdded = 0;
        itemRows.forEach((row, index) => {
            const firstCell = row.querySelector('td'); // Assumes checkbox goes in the first cell
            if (!firstCell) {
                log(`Row ${index + 1}: Could not find the first cell.`);
                return; // Skip malformed row
            }
            // Check if a checkbox with our specific class already exists in this cell
            if (firstCell.querySelector(`.${CHECKBOX_CLASS}`)) {
                return; // Skip if already present
            }

            // Create and configure the checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.classList.add(CHECKBOX_CLASS);
            // Styling is applied via injected CSS targeting the class

            // Add shift-click listener
            checkbox.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent checkbox click from triggering row actions (if any)
                const currentCheckbox = event.target;

                // Handle shift-click for range selection
                if (event.shiftKey && lastChecked && lastChecked !== currentCheckbox) {
                    log("Shift-click detected.");
                    // Get all checkboxes currently in the DOM (in visual order)
                    const allCheckboxes = Array.from(document.querySelectorAll(`.${CHECKBOX_CLASS}`));
                    const lastIndex = allCheckboxes.indexOf(lastChecked);
                    const currentIndex = allCheckboxes.indexOf(currentCheckbox);

                    if (lastIndex !== -1 && currentIndex !== -1) { // Ensure both are found
                        const start = Math.min(lastIndex, currentIndex);
                        const end = Math.max(lastIndex, currentIndex);
                        log(`Applying shift-click between index ${start} and ${end}`);
                        // Set all checkboxes in the range to the same state as the clicked one
                        const setStateTo = currentCheckbox.checked;
                        for (let i = start; i <= end; i++) {
                            allCheckboxes[i].checked = setStateTo;
                        }
                        displayStatus(`Toggled selection range [${start + 1}-${end + 1}] to ${setStateTo}.`);
                    } else {
                        log("Could not find clicked checkboxes in the list for shift-click.");
                    }
                    // Update the anchor point even on shift-click for subsequent range selections
                    lastChecked = currentCheckbox;
                } else {
                    // Regular click: update the anchor point
                    lastChecked = currentCheckbox;
                }
            });

            // Add the checkbox to the beginning of the first cell
            firstCell.prepend(checkbox);
            checkboxesAdded++;
        });

        // Update status only if new checkboxes were actually added
        if (checkboxesAdded > 0) {
            log(`Added ${checkboxesAdded} new checkboxes.`);
            displayStatus(`Refreshed checkboxes: Added ${checkboxesAdded}.`);
        } else {
            log("No new checkboxes needed.");
            // Optional: displayStatus("Checkboxes up-to-date."); // Avoid overwriting other statuses
        }
    }

    /**
     * Performs the multi-step process of deleting a single prompt via the UI.
     * Handles finding buttons, clicking, waiting for menus/dialogs, and final confirmation.
     * @param {Element} itemRowElement - The TR element of the prompt row to delete.
     * @returns {Promise<boolean>} True if deletion was fully confirmed, false otherwise.
     */
    async function deleteSingleItem(itemRowElement) {
        // Attempt to get the item name for better logging
        const itemNameElement = itemRowElement.querySelector(ITEM_NAME_SELECTOR);
        const itemName = itemNameElement ? itemNameElement.textContent.trim() : `Row ${itemRowElement.rowIndex}`; // Fallback name
        log(`Starting delete process for item: "${itemName}"`);
        displayStatus(`Deleting: ${itemName}...`);

        try {
            // --- Step 1: Click 3-dots menu button ---
            const threeDotsButton = itemRowElement.querySelector(THREE_DOTS_BUTTON_SELECTOR);
            if (!threeDotsButton) throw new Error("Could not find 3-dots button.");
            log(`Clicking 3-dots button for "${itemName}"`);
            threeDotsButton.click();
            await delay(ACTION_DELAY_MS);

            // --- Step 2: Click 'Delete prompt' in the menu ---
            // The menu appears in the overlay container, so search globally (document.body)
            const menuPanel = await waitForElement(MENU_PANEL_SELECTOR, ELEMENT_WAIT_TIMEOUT_MS, document.body);
            if (!menuPanel) throw new Error("Menu panel did not appear.");
            log(`Menu panel found for "${itemName}". Searching for 'Delete prompt' option...`);
            let deleteMenuItem = null;
            const menuItems = menuPanel.querySelectorAll(DELETE_MENU_ITEM_SELECTOR);
            for (const item of menuItems) {
                const textSpan = item.querySelector('span.mat-mdc-menu-item-text');
                // Check text content robustly
                if (textSpan && textSpan.textContent.includes('Delete prompt')) {
                    deleteMenuItem = item;
                    log(`'Delete prompt' menu item found.`);
                    break;
                }
            }
            if (!deleteMenuItem) throw new Error("Could not find 'Delete prompt' menu item.");
            log(`Clicking 'Delete prompt' menu item for "${itemName}"`);
            deleteMenuItem.click();
            await delay(ACTION_DELAY_MS); // Wait for confirmation dialog to potentially appear

            // --- Step 3: Handle Confirmation Dialog ---
            const confirmDialog = await waitForElement(CONFIRM_DIALOG_PANEL_SELECTOR, ELEMENT_WAIT_TIMEOUT_MS, document.body);
            if (!confirmDialog) throw new Error("Confirmation dialog did not appear.");
            log(`Confirmation dialog found for "${itemName}". Searching for final 'Delete' button...`);

            // --- Step 4: Click the final 'Delete' button ---
            const finalDeleteButton = confirmDialog.querySelector(FINAL_DELETE_BUTTON_SELECTOR);
            if (!finalDeleteButton) throw new Error("Could not find final 'Delete' button in confirmation dialog.");
            log(`Final 'Delete' button found. Clicking for "${itemName}"...`);
            finalDeleteButton.click();
            await delay(ACTION_DELAY_MS * 1.5); // Allow slightly longer for UI to process final delete

            displayStatus(`Deleted: ${itemName}.`); // Update status after successful confirmation
            log(`Deletion confirmed for: "${itemName}".`);
            return true; // Deletion process successfully completed

        } catch (error) {
            log(`Error during deletion process for "${itemName}": ${error.message}`);
            displayStatus(`Error deleting ${itemName}: ${error.message}. Skipping.`);
            // Attempt cleanup if possible (e.g., close dangling menus/dialogs) - Best effort
            try {
                const openMenu = document.body.querySelector(MENU_PANEL_SELECTOR);
                if (openMenu) {
                    const backdrop = document.querySelector('div.cdk-overlay-backdrop.cdk-overlay-transparent-backdrop.cdk-overlay-backdrop-showing');
                    if (backdrop) backdrop.click();
                }
                const openDialog = document.body.querySelector(CONFIRM_DIALOG_PANEL_SELECTOR);
                if (openDialog) {
                    const cancelButton = openDialog.querySelector('mat-dialog-actions button[aria-label="Cancel"]');
                    if (cancelButton) cancelButton.click();
                    else {
                        const closeButton = openDialog.querySelector('h2 button[aria-label="Close"]');
                        if(closeButton) closeButton.click();
                    }
                }
            } catch (cleanupError) {
                log(`Error during cleanup attempt: ${cleanupError.message}`);
            }
            return false; // Indicate deletion failed
        }
    }

    /**
     * Attaches event listeners to the control panel buttons.
     */
    function addEventListeners() {
        log("Attempting to add event listeners...");

        // --- Invert Selection Button Listener ---
        const invertBtn = document.getElementById(INVERT_BTN_ID);
        if (invertBtn) {
            invertBtn.addEventListener('click', () => {
                log('Invert Selection button clicked.');
                const allCheckboxes = document.querySelectorAll(`.${CHECKBOX_CLASS}`);
                if (allCheckboxes.length === 0) { displayStatus("No checkboxes found to invert."); return; }
                let changedCount = 0;
                allCheckboxes.forEach(cb => { cb.checked = !cb.checked; changedCount++; });
                displayStatus(`Inverted selection for ${changedCount} items.`);
                lastChecked = null; // Reset shift-click anchor after global operation
            });
            log('Invert Selection listener added.');
        } else { log('Warning: Invert Selection button not found.'); }

        // --- Refresh Checkboxes Button Listener ---
        const refreshBtn = document.getElementById(REFRESH_BTN_ID);
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                log('Refresh Checkboxes button clicked.');
                displayStatus('Refreshing checkboxes...');
                // Use timeout to allow status message to render before potentially blocking DOM work
                setTimeout(() => { addCheckboxes(); }, 50);
            });
            log('Refresh Checkboxes listener added.');
        } else { log('Warning: Refresh Checkboxes button not found.'); }

        // --- Delete Selected Button Listener ---
        const deleteBtn = document.getElementById(DELETE_BTN_ID);
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
                log('Delete Selected button clicked.');
                const checkedCheckboxes = document.querySelectorAll(`.${CHECKBOX_CLASS}:checked`);
                if (checkedCheckboxes.length === 0) {
                    displayStatus("No items selected for deletion.");
                    alert("Please select at least one item to delete.");
                    return;
                }

                // ** Get stable identifiers (names) BEFORE starting deletion **
                const namesToDelete = [];
                for (const cb of checkedCheckboxes) {
                    const row = cb.closest(ITEM_ROW_SELECTOR);
                    if (row) {
                        const nameElement = row.querySelector(ITEM_NAME_SELECTOR);
                        if (nameElement) { namesToDelete.push(nameElement.textContent.trim()); }
                        else { log("Warning: Could not find name for a selected row. Skipping it."); }
                    }
                }

                if (namesToDelete.length === 0) { displayStatus("Could not identify any selected items by name."); return; }
                log(`Identified ${namesToDelete.length} items to delete by name: ${namesToDelete.join(', ')}`);

                // User confirmation
                const confirmation = confirm(`Are you sure you want to delete ${namesToDelete.length} selected item(s)?`);
                if (!confirmation) { displayStatus("Deletion cancelled by user."); return; }

                // Prepare for deletion loop
                displayStatus(`Starting deletion of ${namesToDelete.length} item(s)...`);
                deleteBtn.disabled = true; invertBtn.disabled = true; refreshBtn.disabled = true; // Disable all buttons
                let deletedCount = 0; let failedCount = 0;

                // Loop through the identified NAMES (backwards is safer for UI changes)
                for (let i = namesToDelete.length - 1; i >= 0; i--) {
                    const targetName = namesToDelete[i];
                    log(`--- Processing deletion for: "${targetName}" ---`);

                    // Find the row dynamically in the *current* DOM state
                    const currentRow = findRowByName(targetName);

                    if (currentRow) {
                        // Attempt the deletion process for this specific item
                        const success = await deleteSingleItem(currentRow);
                        if (success) {
                            deletedCount++;
                        } else {
                            failedCount++;
                            // Try to uncheck the box in the row we *attempted* to delete, if it still exists
                            const checkboxInFailedRow = findRowByName(targetName)?.querySelector(`.${CHECKBOX_CLASS}`); // Re-find row just in case
                             if (checkboxInFailedRow) checkboxInFailedRow.checked = false;
                             log(`Deletion failed for "${targetName}". Unchecking its box if found.`);
                        }
                    } else {
                        // Row wasn't found, likely removed by a previous step or UI update
                        log(`Item "${targetName}" not found in current table. Assuming already deleted or gone.`);
                        // Count this as contributing to the goal (item is gone)
                        deletedCount++;
                    }
                    // Wait between processing each item to allow the UI to stabilize
                    log(`Waiting ${INTER_ITEM_DELAY_MS}ms before processing next item...`);
                    await delay(INTER_ITEM_DELAY_MS);
                }

                // Final status update and re-enable buttons
                displayStatus(`Deletion complete. Targets: ${namesToDelete.length}. Success/Gone: ${deletedCount}. Failed: ${failedCount}.`);
                deleteBtn.disabled = false; invertBtn.disabled = false; refreshBtn.disabled = false;
                lastChecked = null; // Reset shift-click anchor

                // Refresh checkboxes after a short delay to catch any UI updates
                log("Waiting briefly before refreshing checkboxes...");
                await delay(POST_DELETE_REFRESH_DELAY);
                addCheckboxes();
                log("Checkbox refresh attempted post-delete.");
            });
            log('Delete Selected listener added.');
        } else { log('Warning: Delete Selected button not found.'); }
    }

    // --- Initialization ---

    /**
     * Main initialization function for the script.
     * Waits for necessary elements, injects styles and UI, and adds listeners.
     */
    async function init() {
        log("Initializing script...");

        // Inject styles early
        injectStyles();

        // Wait for the main library section to ensure the page structure is ready
        const section = await waitForElement(SECTION_VIEW_SELECTOR, ELEMENT_WAIT_TIMEOUT_MS);
        if (!section) { log("Target section element not found. Script cannot proceed."); return; }

        // Wait for at least one item row to appear - indicates table data is loading/loaded
        const firstRow = await waitForElement(ITEM_ROW_SELECTOR, ELEMENT_WAIT_TIMEOUT_MS, section);
        if (!firstRow) { log("First item row not found. Cannot proceed reliably."); return; }
        log("Core page elements found. Proceeding with UI injection and setup.");

        // Add the control panel, then checkboxes, then listeners
        addControls();

        // Only proceed if controls were successfully added (statusDisplay is linked)
        if (statusDisplay) {
            addCheckboxes();
            addEventListeners();
            // Set final initialization status message if not already displaying progress
            const currentStatus = statusDisplay.textContent;
            if (!currentStatus.includes("Added") && !currentStatus.includes("Controls added") && !currentStatus.includes("Refreshed")) {
                displayStatus("Script initialization complete.");
            }
        } else {
            log("Initialization failed: Control panel could not be added or status element not found.");
            // Log failure prominently if UI isn't available
            log("--- AI STUDIO DELETER FAILED TO INITIALIZE ---");
        }
    }

    // --- Script Entry Point ---
    log(`Script loaded. Waiting ${INITIAL_DELAY_MS}ms before init to allow page dynamic loading...`);
    // Use setTimeout to delay initialization, allowing the dynamic web app time to render initial elements
    setTimeout(init, INITIAL_DELAY_MS);

})();