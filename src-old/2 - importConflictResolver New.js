
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
