import { addAnswerToCategory } from '../categoryManagement.js';

// Import functions from conflictCategoryManagement.js
import { updateCategoryName, validateCategoryName } from './conflictCategoryManagement.js';

// Import functions from conflictGroup.js
import { markGroupResolved } from './conflictGroup.js';

// Import functions from conflictSummary.js
import { updateConflictSummary } from './conflictSummary.js';

/**
 * @typedef {Object} Category
 * @property {string} category - Category name
 * @property {string[]} answers - Array of answers
 * @property {string} [source] - Source of the category (e.g., filename)
 */

/**
 * @typedef {Object} ConflictGroup
 * @property {Category} existing - Existing category
 * @property {Category[]} newCategories - Array of new categories with same name
 */

let conflictGroups = [];
let currentResolutions = new Map();

/**
 * Initializes category name editing functionality
 * @param {HTMLElement} column - Category column element
 * @param {number} groupIndex - Index of the conflict group
 * @param {number} categoryIndex - Index of the category
 */
function initializeCategoryNameEditing(column, groupIndex, categoryIndex) {
    const nameInput = column.querySelector('.category-name-input');
    const resetBtn = column.querySelector('.reset-name-btn');
    const originalName = nameInput.dataset.original;
    
    // Auto-save when input changes
    nameInput.addEventListener('input', () => {
        const newName = nameInput.value.trim();
        const hasChanged = newName !== originalName;
        const isEmpty = !newName;
        
        if (hasChanged && !isEmpty && validateCategoryName(nameInput)) {
            updateCategoryName(groupIndex, categoryIndex, newName);
            nameInput.dataset.original = newName;
            
            // Mark as resolved when renamed
            const group = document.getElementById(`conflict-group-${groupIndex}`);
            if (group) {
                markGroupResolved(group, 'rename');
                currentResolutions.set(groupIndex, {
                    action: 'rename',
                    renameType: 'custom',
                    customName: newName
                });
                updateConflictSummary();
            }
        }
        
        resetBtn.style.display = hasChanged ? 'inline-flex' : 'none';
    });
    
    // Reset button handler
    resetBtn.addEventListener('click', () => {
        nameInput.value = originalName;
        resetBtn.style.display = 'none';
        nameInput.classList.remove('invalid');
        updateCategoryName(groupIndex, categoryIndex, originalName);
        
        // Remove resolved status
        const group = document.getElementById(`conflict-group-${groupIndex}`);
        if (group) {
            group.classList.remove('resolved-rename');
            currentResolutions.delete(groupIndex);
            updateConflictSummary();
        }
    });
    
    // Remove save button as it's no longer needed
    column.querySelector('.save-name-btn')?.remove();
}

/**
 * Handles overwrite resolution
 * @param {ConflictGroup} conflict - Conflict group
 * @param {Object} resolution - Resolution details
 */
async function handleOverwriteResolution(conflict, resolution) {
    const categoryElement = document.getElementById(conflict.existing.category);
    if (!categoryElement) return;
    
    const answersList = categoryElement.querySelector('.answers-list');
    if (!answersList) return;
    
    // Clear existing answers
    answersList.innerHTML = '';
    
    // Add selected answers
    [...resolution.selectedAnswers].forEach(answer => {
        addAnswerToCategory(conflict.existing.category, answer);
    });
}


/**
 * Gets the selected new category from a conflict group
 * @param {HTMLElement} group - Conflict group element
 * @returns {Category} Selected category data
 */
function getSelectedNewCategory(group) {
    const groupIndex = parseInt(group.id.split('-').pop(), 10);
    const conflict = conflictGroups[groupIndex];
    
    // If there's only one new category, return it
    if (conflict.newCategories.length === 1) {
        return conflict.newCategories[0];
    }
    
    // Find selected category
    const selectedColumn = group.querySelector('.new-category.selected');
    if (selectedColumn) {
        const categoryIndex = parseInt(selectedColumn.dataset.categoryIndex, 10);
        return conflict.newCategories[categoryIndex];
    }
    
    // Default to first category if none selected
    return conflict.newCategories[0];
}

// Export each function individually
export { initializeCategoryNameEditing, handleOverwriteResolution, getSelectedNewCategory };