// Import functions from conflictCategoryManagement.js
import { 
  createNewCategoryColumn, 
  populateCategoryColumn, 
} from './conflictCategoryManagement.js';

// Import functions from conflictDragAndDrop.js
import { 
  initializeDragAndDrop, 
} from './conflictDragAndDrop.js';

// Import functions from conflictEventListeners.js
import { 
  initializeActionButtons, 
} from './conflictEventListeners.js';

// Import functions from conflictSummary.js
import { 
  updateConflictSummary, 
} from './conflictSummary.js';

/**
 * Creates a conflict group element
 * @param {ConflictGroup} conflict - Conflict group data
 * @param {number} index - Index of the conflict group
 * @returns {HTMLElement|null} The created conflict group element
 */
function createConflictGroup(conflict, index) {
    if (!conflict) return null;
    
    const element = document.createElement('div');
    element.className = 'conflict-group';
    element.id = `conflict-group-${index}`;
    
    element.innerHTML = `
        <div class="conflict-group-header">
            <h3 class="conflict-group-title">Conflict Group: <span class="category-name">${conflict.existing.category}</span></h3>
            <button class="action-skip icon-button" title="Skip">
                <img src="node_modules/feather-icons/dist/icons/x.svg" alt="Skip" class="icon">
            </button>
        </div>
        <div class="categories-container">
            <div class="existing-category category" data-category-id="${conflict.existing.category}">
                <div class="category-content">
                    <h3>Existing Category</h3>
                    <div class="answers-list" data-droppable="true"></div>
                </div>
            </div>
            <div class="new-categories"></div>
        </div>
        <div class="conflict-actions">
            <button class="action-overwrite icon-button" title="Overwrite with selected">
                <img src="node_modules/feather-icons/dist/icons/copy.svg" alt="Overwrite" class="icon">
                <span>Overwrite</span>
            </button>
        </div>
    `;
    
    // Setup existing category
    const existingColumn = element.querySelector('.existing-category');
    if (existingColumn) {
        populateCategoryColumn(existingColumn, conflict.existing, true);
    }
    
    // Setup new categories
    const newCategoriesContainer = element.querySelector('.new-categories');
    if (newCategoriesContainer && conflict.newCategories) {
        conflict.newCategories.forEach((newCat, catIndex) => {
            const newColumn = createNewCategoryColumn(newCat, index, catIndex);
            if (newColumn) {
                newCategoriesContainer.appendChild(newColumn);
            }
        });
    }
    
    // Initialize drag and drop
    initializeDragAndDrop(element, index);
    
    // Initialize action buttons
    initializeActionButtons(element, index);
    
    return element;
}

/**
 * Handles the skip action
 * @param {number} groupIndex - Index of the conflict group
 */
function handleSkipAction(groupIndex) {
    // Remove group from DOM
    const group = document.getElementById(`conflict-group-${groupIndex}`);
    if (!group) return;
    group.remove();

    // Remove from tracking
    conflictGroups.splice(groupIndex, 1);
    currentResolutions.delete(groupIndex);

    // Update conflict count
    const countElement = document.querySelector('#conflicts-count');
    if (countElement) {
        countElement.textContent = conflictGroups.length;
    }

    // Update summary
    updateConflictSummary();

    // If no conflicts remain, close modal
    if (conflictGroups.length === 0) {
        closeConflictModal();
    }
}

/**
 * Handles the rename action
 * @param {number} groupIndex - Index of the conflict group
 */
function handleRenameAction(groupIndex) {
    const group = document.getElementById(`conflict-group-${groupIndex}`);
    const renameOptions = group.querySelector('.rename-options');
    renameOptions.style.display = 'block';
    
    // Hide merge preview if visible
    const mergePreview = group.querySelector('.merge-preview');
    mergePreview.style.display = 'none';
    
    markGroupResolved(group, 'rename');
    currentResolutions.set(groupIndex, { 
        action: 'rename',
        renameType: 'auto' // Default to auto-numbering
    });
    updateConflictSummary();
}

/**
 * Handles the overwrite action
 * @param {number} groupIndex - Index of the conflict group
 */
function handleOverwriteAction(groupIndex) {
    const group = document.getElementById(`conflict-group-${groupIndex}`);
    if (!group) return;

    // Get selected new category
    const selectedNewCategory = group.querySelector('.new-category.selected');
    const newCategoryElement = selectedNewCategory || group.querySelector('.new-category');
    
    if (!newCategoryElement) return;

    // Get current answers from the new category's DOM
    const newAnswers = [...newCategoryElement.querySelectorAll('.answer span')]
        .map(span => span.textContent);

    // Update conflict group data
    const conflict = conflictGroups[groupIndex];
    conflict.existing.answers = [...newAnswers];

    // Update existing category preview
    const existingList = group.querySelector('.existing-category .answers-list');
    if (existingList) {
        existingList.innerHTML = '';
        newAnswers.forEach(answer => {
            const answerElement = document.createElement('div');
            answerElement.className = 'answer';
            answerElement.draggable = true;
            answerElement.innerHTML = `<span>${answer}</span>`;
            
            answerElement.addEventListener('dragstart', () => {
                answerElement.classList.add('dragging');
            });
            
            answerElement.addEventListener('dragend', () => {
                answerElement.classList.remove('dragging');
            });
            
            existingList.appendChild(answerElement);
        });
    }

    // Mark as resolved
    markGroupResolved(group, 'overwrite');
    currentResolutions.set(groupIndex, { 
        action: 'overwrite',
        selectedAnswers: new Set(newAnswers)
    });
    
    // Update UI
    updateConflictSummary();
}

/**
 * Marks a conflict group as resolved
 * @param {HTMLElement} group - Conflict group element
 * @param {string} action - Resolution action (skip/rename/overwrite)
 */
function markGroupResolved(group, action) {
    if (!group || !action) return;
    
    const validActions = ['skip', 'rename', 'overwrite'];
    if (!validActions.includes(action)) return;
    
    // Update classes
    group.classList.remove(...validActions.map(a => `resolved-${a}`));
    group.classList.add(`resolved-${action}`);
    
    // Update buttons
    const buttons = group.querySelectorAll('.conflict-actions button');
    buttons.forEach(button => {
        button.classList.toggle('selected', 
            button.classList.contains(`action-${action}`)
        );
    });
    
    // Update resolution status
    const groupIndex = parseInt(group.id.split('-').pop(), 10);
    if (!isNaN(groupIndex)) {
        currentResolutions.set(groupIndex, { action });
        updateConflictSummary();
    }
}

// Export each function individually
export { createConflictGroup, handleSkipAction, handleRenameAction, handleOverwriteAction, markGroupResolved };
