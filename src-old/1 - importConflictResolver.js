import { addCategory, addAnswerToCategory } from './categoryManagement.js';
import { showPopupModal } from './uiManager.js';

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
 * Creates a new category column with editable name
 * @param {Category} category - Category data
 * @param {number} groupIndex - Index of the conflict group
 * @param {number} categoryIndex - Index of the category
 * @returns {HTMLElement} The created category column
 */
function createNewCategoryColumn(category, groupIndex, categoryIndex) {
    const column = document.createElement('div');
    column.className = 'category new-category';
    column.dataset.groupIndex = groupIndex;
    column.dataset.categoryIndex = categoryIndex;

    column.innerHTML = `
        <div class="category-content">
            <div class="category-header">
                <div class="category-name-container">
                    <div class="input-wrapper">
                        <input type="text" 
                               class="category-name-input" 
                               value="${category.category}"
                               data-original="${category.category}">
                        ${category.source ? `<span class="input-hint">(from ${category.source})</span>` : ''}
                    </div>
                    <button class="icon-button save-name-btn" style="display: none;">
                        <img src="node_modules/feather-icons/dist/icons/check.svg" alt="Save" class="icon">
                    </button>
                    <button class="icon-button reset-name-btn" style="display: none;">
                        <img src="node_modules/feather-icons/dist/icons/rotate-cw.svg" alt="Reset" class="icon">
                    </button>
                </div>
                <button class="action-skip icon-button" title="Skip this category">
                    <img src="node_modules/feather-icons/dist/icons/x.svg" alt="Skip" class="icon">
                </button>
                
            </div>
            <div class="answers-list"></div>
        </div>
                <button class="action-overwrite icon-button" title="Overwrite existing with this category">
            <img src="node_modules/feather-icons/dist/icons/copy.svg" alt="Overwrite" class="icon">
            <span>Overwrite</span>
        </button>

    `;

    // Initialize name editing functionality
    initializeCategoryNameEditing(column, groupIndex, categoryIndex);

    // Populate answers
    populateCategoryColumn(column, category, false);

    return column;
}

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
 * Validates a category name
 * @param {HTMLInputElement} input - Name input element
 * @returns {boolean} Whether the name is valid
 */
function validateCategoryName(input) {
    const name = input.value.trim();
    const isValid = name.length > 0 && !document.getElementById(name);
    
    input.classList.toggle('invalid', !isValid);
    return isValid;
}

/**
 * Updates a category name in the conflict groups
 * @param {number} groupIndex - Index of the conflict group
 * @param {number} categoryIndex - Index of the category
 * @param {string} newName - New category name
 */
function updateCategoryName(groupIndex, categoryIndex, newName) {
    const conflict = conflictGroups[groupIndex];
    conflict.newCategories[categoryIndex].category = newName;
    
    // Update resolution if exists
    const resolution = currentResolutions.get(groupIndex);
    if (resolution?.action === 'rename') {
        resolution.customName = newName;
    }
}

/**
 * Populates a category column with answers
 * @param {HTMLElement} column - Column element to populate
 * @param {Category} category - Category data
 * @param {boolean} isExisting - Whether this is an existing category
 */
function populateCategoryColumn(column, category, isExisting) {
    const answersList = column.querySelector('.answers-list');
    if (!answersList) return;
    
    category.answers.forEach(answer => {
        const answerElement = document.createElement('div');
        answerElement.className = 'answer';
        answerElement.draggable = true;
        
        answerElement.innerHTML = `<span>${answer}</span>`;
        
        // Add drag handlers
        answerElement.addEventListener('dragstart', () => {
            answerElement.classList.add('dragging');
        });
        
        answerElement.addEventListener('dragend', () => {
            answerElement.classList.remove('dragging');
        });
        
        // Add visual indicators for new/missing answers
        if (!isExisting) {
            const existingAnswers = conflictGroups.find(g => 
                g.existing.category === category.category
            )?.existing.answers || [];
            
            if (!existingAnswers.includes(answer)) {
                answerElement.classList.add('new');
            }
        }
        
        answersList.appendChild(answerElement);
    });
}

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
    const newCategoryColumns = groupElement.querySelectorAll('.new-category');

    newCategoryColumns.forEach((column, categoryIndex) => {
        const overwriteButton = column.querySelector('.action-overwrite');
        if (overwriteButton) {
            overwriteButton.addEventListener('click', () => {
                handleOverwriteAction(groupIndex, categoryIndex);
            });
        }

        const skipButtonInColumn = column.querySelector('.action-skip');
        if (skipButtonInColumn) {
            skipButtonInColumn.addEventListener('click', () => {
                handleSkipAction(groupIndex, categoryIndex);
            });
        }
    });

    if (skipButton) {
        skipButton.addEventListener('click', () => handleSkipAction(groupIndex));
    }
}

/**
 * Handles the skip action
 * @param {number} groupIndex - Index of the conflict group
 */
function handleSkipAction(groupIndex, categoryIndex) {
    const group = document.getElementById(`conflict-group-${groupIndex}`);
    if (!group) return;

    if (categoryIndex !== undefined) {
        // Remove specific new category
        const newCategoryColumn = group.querySelector(`.new-category[data-category-index="${categoryIndex}"]`);
        if (newCategoryColumn) {
            newCategoryColumn.remove();
        }
        // Update conflict data
        if (conflictGroups[groupIndex].newCategories) {
            conflictGroups[groupIndex].newCategories.splice(categoryIndex, 1);
        }
        // Update resolutions
        currentResolutions.set(groupIndex, {
            action: 'skip',
            categoryIndex: categoryIndex
        });
    } else {
        // Remove entire conflict group
        group.remove();
        conflictGroups.splice(groupIndex, 1);
        currentResolutions.delete(groupIndex);
    }

    // Update conflict count
    const countElement = document.querySelector('#conflicts-count');
    if (countElement) {
        countElement.textContent = calculateTotalConflicts();
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
function handleOverwriteAction(groupIndex, categoryIndex) {
    const group = document.getElementById(`conflict-group-${groupIndex}`);
    if (!group) return;

    const newCategoryColumn = group.querySelector(`.new-category[data-category-index="${categoryIndex}"]`);
    if (newCategoryColumn) {
        // Get answers from the new category
        const newAnswers = [...newCategoryColumn.querySelectorAll('.answer span')]
            .map(span => span.textContent);

        // Update existing category with new answers
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

        // Update conflict data
        if (conflictGroups[groupIndex].existing) {
            conflictGroups[groupIndex].existing.answers = newAnswers;
        }

        // Remove the used new category
        newCategoryColumn.remove();
        if (conflictGroups[groupIndex].newCategories) {
            conflictGroups[groupIndex].newCategories.splice(categoryIndex, 1);
        }

        // Update resolutions with selectedAnswers
        currentResolutions.set(groupIndex, {
            action: 'overwrite',
            categoryIndex: categoryIndex,
            selectedAnswers: new Set(newAnswers) // Ensure selectedAnswers is a Set
        });

        // Mark the group as resolved
        markGroupResolved(group, 'overwrite');
    }

    // Update conflict count
    const countElement = document.querySelector('#conflicts-count');
    if (countElement) {
        countElement.textContent = calculateTotalConflicts();
    }

    // Update summary
    updateConflictSummary();

    // If no conflicts remain, close modal
    if (conflictGroups.length === 0) {
        closeConflictModal();
    }
}

/**
 * Initializes drag and drop functionality
 * @param {HTMLElement} group - Conflict group element
 * @param {number} groupIndex - Index of the conflict group
 */
function initializeDragAndDrop(group, groupIndex) {
    if (!group || typeof groupIndex !== 'number') return;
    
    try {
        const answerLists = group.querySelectorAll('.answers-list[data-droppable="true"]');
        
        answerLists.forEach(list => {
            const safeList = cleanupEventListeners(list);
            
            safeList.addEventListener('dragover', (e) => {
                try {
                    e.preventDefault();
                    const draggingElement = document.querySelector('.dragging');
                    if (draggingElement) {
                        const afterElement = getDragAfterElement(safeList, e.clientY);
                        if (afterElement) {
                            safeList.insertBefore(draggingElement, afterElement);
                        } else {
                            safeList.appendChild(draggingElement);
                        }
                    }
                } catch (error) {
                    console.error('Drag over handling failed:', error);
                }
            });
            
            safeList.addEventListener('drop', (e) => {
                try {
                    e.preventDefault();
                    updateResolutionFromDrag(group, groupIndex);
                } catch (error) {
                    console.error('Drop handling failed:', error);
                    showPopupModal('Error', 'Failed to process drag and drop operation');
                }
            });
        });
    } catch (error) {
        console.error('Drag-drop initialization failed:', error);
    }
}

/**
 * Gets the element to insert the dragged item after
 * @param {HTMLElement} container - Container element
 * @param {number} y - Mouse Y position
 * @returns {HTMLElement} Element to insert after
 */
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.answer:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/**
 * Updates resolution based on current drag state
 * @param {HTMLElement} group - Conflict group element
 * @param {number} groupIndex - Index of the conflict group
 */
function updateResolutionFromDrag(group, groupIndex) {
    const existingList = group.querySelector('.existing-category .answers-list');
    const selectedAnswers = [...existingList.querySelectorAll('.answer')]
        .map(answer => answer.querySelector('span').textContent);
    
    currentResolutions.set(groupIndex, {
        action: 'overwrite',
        selectedAnswers: new Set(selectedAnswers)
    });
    
    updateConflictSummary();
}

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
 * Updates the conflict resolution summary
 */
function updateConflictSummary() {
    const summary = document.querySelector('.conflict-summary');
    if (!summary) return;

    const totalConflicts = calculateTotalConflicts();
    const resolvedConflicts = calculateResolvedConflicts();

    summary.textContent = `Resolved ${resolvedConflicts} of ${totalConflicts} conflicts`;

    // Enable/disable apply button
    const applyButton = document.getElementById('apply-changes');
    if (applyButton) {
        applyButton.disabled = resolvedConflicts < totalConflicts;
    }
}

function calculateTotalConflicts() {
    return conflictGroups.reduce((acc, conflict) => acc + (conflict.newCategories ? conflict.newCategories.length : 0), 0);
}

function calculateResolvedConflicts() {
    let resolved = 0;
    currentResolutions.forEach((resolution, groupIndex) => {
        const conflict = conflictGroups[groupIndex];
        if (resolution.action === 'skip' || resolution.action === 'overwrite') {
            resolved++;
        } else if (resolution.action === 'rename') {
            // If the conflict group has been renamed, consider it resolved
            resolved++;
        }
    });
    return resolved;
}

/**
 * Checks if there are unresolved conflicts
 * @returns {boolean} True if there are unresolved conflicts
 */
function hasUnresolvedConflicts() {
    return currentResolutions.size < conflictGroups.length;
}

/**
 * Applies all conflict resolutions
 * @returns {Promise<void>}
 */
async function applyResolutions() {
    const results = {
        skipped: 0,
        renamed: 0,
        overwritten: 0
    };
    
    try {
        for (const [index, resolution] of currentResolutions.entries()) {
            const conflict = conflictGroups[index];
            
            switch (resolution.action) {
                case 'skip':
                    results.skipped++;
                    break;
                    
                case 'rename':
                    await handleRenameResolution(conflict, resolution);
                    results.renamed++;
                    break;
                    
                case 'overwrite':
                    await handleOverwriteResolution(conflict, resolution);
                    results.overwritten++;
                    break;
            }
        }
        
        showPopupModal('Import Summary', `
            Categories processed:
              - Skipped: ${results.skipped}
              - Renamed: ${results.renamed}
              - Overwritten: ${results.overwritten}
        `, { autoClose: true });
        
        closeConflictModal();
    } catch (error) {
        console.error('Error applying resolutions:', error);
        showPopupModal('Error', 'Failed to apply some changes. Please try again.');
    }
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
    if (resolution.selectedAnswers && resolution.selectedAnswers instanceof Set) {
        resolution.selectedAnswers.forEach(answer => {
            addAnswerToCategory(conflict.existing.category, answer);
        });
    } else {
        console.error('selectedAnswers is not a Set:', resolution.selectedAnswers);
        throw new Error('Invalid selectedAnswers in resolution');
    }
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
        const conflict = conflictGroups[groupIndex];
        const resolution = currentResolutions.get(groupIndex) || { action };
        
        // Update resolution based on action
        switch (action) {
            case 'skip':
                resolution.action = 'skip';
                break;
            case 'rename':
                resolution.action = 'rename';
                resolution.renameType = resolution.renameType || 'auto'; // Default to auto if not set
                break;
            case 'overwrite':
                resolution.action = 'overwrite';
                break;
        }
        
        currentResolutions.set(groupIndex, resolution);
        updateConflictSummary();
    }
}
