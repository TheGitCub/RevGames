import { addCategory, addAnswerToCategory } from '../categoryManagement.js';

// Import functions from conflictSummary.js
import { updateConflictSummary } from './conflictSummary.js';

/**
 * Initializes rename options for a conflict group
 * @param {HTMLElement} group - Conflict group element
 * @param {number} groupIndex - Index of the conflict group
 */
function initializeRenameOptions(group, groupIndex) {
    const renameOptions = group.querySelector('.rename-options');
    const customInput = renameOptions.querySelector('.custom-name-input');
    
    // Handle rename type change
    renameOptions.querySelectorAll('input[name="rename-type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const isCustom = e.target.id === 'custom-name';
            customInput.disabled = !isCustom;
            
            updateRenameResolution(groupIndex, isCustom ? 'custom' : 'auto');
        });
    });
    
    // Handle custom name input
    customInput.addEventListener('input', (e) => {
        const newName = e.target.value.trim();
        if (newName) {
            updateRenameResolution(groupIndex, 'custom', newName);
        }
    });
}

/**
 * Updates rename resolution
 * @param {number} groupIndex - Index of the conflict group
 * @param {string} type - Type of renaming ('auto' or 'custom')
 * @param {string} [customName] - Custom name if type is 'custom'
 */
function updateRenameResolution(groupIndex, type, customName = '') {
    const resolution = {
        action: 'rename',
        renameType: type,
        customName: type === 'custom' ? customName : ''
    };
    
    currentResolutions.set(groupIndex, resolution);
    updateConflictSummary();
}

/**
 * Handles rename resolution
 * @param {ConflictGroup} conflict - Conflict group
 * @param {Object} resolution - Resolution details
 */
async function handleRenameResolution(conflict, resolution) {
    const newName = resolution.renameType === 'custom' 
        ? resolution.customName 
        : generateAutoName(conflict.existing.category);
        
    if (document.getElementById(newName)) {
        throw new Error(`Category "${newName}" already exists`);
    }
    
    // Add new category with new name
    addCategory(newName);
    conflict.newCategories[0].answers.forEach(answer => {
        addAnswerToCategory(newName, answer);
    });
}

/**
 * Generates an auto-numbered name for a category
 * @param {string} baseName - Base category name
 * @returns {string} New unique name
 */
function generateAutoName(baseName) {
    let counter = 1;
    let newName = `${baseName} - ${counter}`;
    
    while (document.getElementById(newName)) {
        counter++;
        newName = `${baseName} - ${counter}`;
    }
    
    return newName;
}

// Export each function individually
export { initializeRenameOptions, updateRenameResolution, handleRenameResolution, generateAutoName };
