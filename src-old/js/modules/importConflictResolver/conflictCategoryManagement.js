// Import functions from importConflictResolver.js
import { 
  initializeCategoryNameEditing, 
} from './importConflictResolver.js';

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
    
    // Add click handler for selection
    column.addEventListener('click', () => {
        const group = document.getElementById(`conflict-group-${groupIndex}`);
        if (!group) return;
        
        group.querySelectorAll('.new-category').forEach(col => 
            col.classList.remove('selected')
        );
        column.classList.add('selected');
    });
    
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
                        <img src="node_modules/feather-icons/dist/icons/x.svg" alt="Reset" class="icon">
                    </button>
                </div>
            </div>
            <div class="answers-list"></div>
        </div>
    `;
    
    // Initialize name editing functionality
    initializeCategoryNameEditing(column, groupIndex, categoryIndex);
    
    // Populate answers
    populateCategoryColumn(column, category, false);
    
    return column;
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

// Export each function individually
export { createNewCategoryColumn, populateCategoryColumn, updateCategoryName, validateCategoryName };
