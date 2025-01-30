/**
 * Handles the drag start event for draggable elements
 * @param {DragEvent} event - The drag event
 */
export function drag(event) {
    if (!(event.target instanceof HTMLElement)) return;
    event.dataTransfer.setData("text", event.target.id);
}

/**
 * Allows dropping by preventing default behavior
 * @param {DragEvent} event - The drag event
 */
export function allowDrop(event) {
    event.preventDefault();
}

/**
 * Handles the drag end event
 * @param {DragEvent} event - The drag event
 */
export function dragEnd(event) {
    event.preventDefault();
}

/**
 * Handles the drop event for draggable elements
 * @param {DragEvent} event - The drop event
 */
export function drop(event) {
    event.preventDefault();
    if (!(event instanceof DragEvent)) return;
    
    const data = event.dataTransfer.getData("text");
    const draggedElement = document.getElementById(data);
    
    // Find either the answers-list or the category container
    const dropZone = event.target instanceof HTMLElement ? 
        event.target.closest('.category') : null;
    
    if (dropZone && draggedElement) {
        // Always place the answer in the answers-list div within the category
        const answersList = dropZone.querySelector('.answers-list');
        if (answersList) {
            answersList.appendChild(draggedElement);
        }
    }
}