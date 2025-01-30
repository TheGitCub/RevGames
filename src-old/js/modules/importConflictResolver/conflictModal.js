// Import functions from conflictEventListeners.js
import { 
  initializeConflictModalListeners, 
  cleanupEventListeners 
} from './conflictEventListeners.js';

// Import functions from conflictGroup.js
import { 
  createConflictGroup, 
} from './conflictGroup.js';

/**
 * Creates a conflict modal structure
 */
function createConflictModalStructure() {
    // Remove existing modal if it exists
    const existingModal = document.getElementById('category-conflict-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create new modal
    const modal = document.createElement('div');
    modal.id = 'category-conflict-modal';
    modal.className = 'modal';
    
    const content = document.createElement('div');
    content.className = 'modal-content conflict-modal';
    
    content.innerHTML = `
        <div class="modal-header">
            <h2>Conflicts Found (<span id="conflicts-count">0</span>)</h2>
            <button class="close-button"><img src="node_modules/feather-icons/dist/icons/x.svg" alt="Skip" class="icon"></button>
        </div>
        <div class="conflicts-container"></div>
        <div class="modal-footer">
            <div class="conflict-summary"></div>
            <div class="action-buttons">
                <button id="cancel-conflicts">Cancel</button>
                <button id="apply-changes" class="primary">Apply Changes</button>
            </div>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    return modal;
}

/**
 * Shows the conflict resolution modal and initializes the UI
 * @param {ConflictGroup[]} conflicts - Array of conflict groups to resolve
 */
export function showConflictModal(conflicts) {
    // Create modal structure and get reference
    const modal = createConflictModalStructure();
    if (!modal) return;
    
    conflictGroups = conflicts;
    const container = modal.querySelector('.conflicts-container');
    if (!container) return;
    
    // Clear previous conflicts
    container.innerHTML = '';
    currentResolutions.clear();
    
    // Update conflicts count
    const countElement = modal.querySelector('#conflicts-count');
    if (countElement) {
        countElement.textContent = conflicts.length;
    }
    
    // Create conflict groups
    conflicts.forEach((conflict, index) => {
        const groupElement = createConflictGroup(conflict, index);
        if (groupElement) {
            container.appendChild(groupElement);
        }
    });
    
    // Initialize event listeners
    initializeConflictModalListeners();
    
    // Show modal
    modal.style.display = 'block';
}

/**
 * Closes and cleans up the conflict resolution modal
 */
function closeConflictModal() {
    const modal = document.getElementById('category-conflict-modal');
    if (!modal) return;
    
    // Clean up event listeners
    const clonedModal = cleanupEventListeners(modal);
    clonedModal.remove();
    
    // Reset state
    conflictGroups = [];
    currentResolutions.clear();
    
    // Dispatch close event
    document.dispatchEvent(new CustomEvent('conflictModalClosed'));
}