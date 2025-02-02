// Import functions from conflictGroup.js
import { 
  handleSkipAction, 
  handleOverwriteAction, 
} from './conflictGroup.js';

// Import functions from conflictSummary.js
import { 
  hasUnresolvedConflicts, 
  applyResolutions 
} from './conflictSummary.js';

/**
 * Initializes event listeners for the conflict modal
 */
function initializeConflictModalListeners() {
    const modal = document.getElementById('category-conflict-modal');
    if (!modal) return;
    
    // Close button handler
    const closeButton = modal.querySelector('.close-button');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            if (hasUnresolvedConflicts()) {
                showConfirmationDialog(
                    'Unresolved Conflicts',
                    'Some conflicts are not resolved. Unresolved categories will be skipped. Continue?',
                    closeConflictModal
                );
            } else {
                closeConflictModal();
            }
        });
    }
    
    // Apply changes button handler
    const applyButton = modal.querySelector('#apply-changes');
    if (applyButton) {
        applyButton.addEventListener('click', applyResolutions);
    }
    
    // Cancel button handler
    const cancelButton = modal.querySelector('#cancel-conflicts');
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            showConfirmationDialog(
                'Cancel Import',
                'Are you sure you want to cancel? All changes will be lost.',
                closeConflictModal
            );
        });
    }
}

/**
 * Initializes action buttons for a conflict group
 * @param {HTMLElement} groupElement - Conflict group element
 * @param {number} groupIndex - Index of the conflict group
 */
function initializeActionButtons(groupElement, groupIndex) {
    const skipButton = groupElement.querySelector('.action-skip');
    const overwriteButton = groupElement.querySelector('.action-overwrite');
    
    if (skipButton) {
        skipButton.addEventListener('click', () => handleSkipAction(groupIndex));
    }
    
    if (overwriteButton) {
        overwriteButton.addEventListener('click', () => handleOverwriteAction(groupIndex));
    }
}

/**
 * Cleans up event listeners by cloning and replacing element
 * @param {HTMLElement} element - Element to clean
 * @returns {HTMLElement} Cloned element
 */
function cleanupEventListeners(element) {
    const clonedElement = element.cloneNode(true);
    element.parentNode.replaceChild(clonedElement, element);
    return clonedElement;
}

// Export each function individually
export { initializeConflictModalListeners, initializeActionButtons, cleanupEventListeners };
