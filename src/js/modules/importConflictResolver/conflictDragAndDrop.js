import { showPopupModal } from '../uiManager.js';

// Import functions from conflictEventListeners.js
import { 
  cleanupEventListeners 
} from './conflictEventListeners.js';

// Import functions from conflictSummary.js
import { 
  updateConflictSummary, 
} from './conflictSummary.js';

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

// Export each function individually
export { initializeDragAndDrop, getDragAfterElement, updateResolutionFromDrag };
