const VIEW_CONSTANTS = {
    ICONS: {
        ROWS: 'node_modules/feather-icons/dist/icons/rows.svg',
        COLUMNS: 'node_modules/feather-icons/dist/icons/columns.svg'
    },
    CLASSES: {
        ROW_VIEW: 'category-row-view',
        COLUMN_VIEW: 'category-column-view'
    },
    DEFAULT_DIRECTION: 'row'
};

/**
 * Custom event fired when view layout changes
 * @type {CustomEvent}
 */
export const viewChangeEvent = new CustomEvent('viewChange', {
    bubbles: true,
    detail: { layout: 'row' }
});

/**
 * Initializes the view toggle functionality
 * @returns {Function} Cleanup function to remove event listeners
 * @throws {Error} If required DOM elements are not found
 */
export function initializeViewToggle() {
    const viewToggleButton = document.getElementById('view-toggle');
    if (!viewToggleButton) {
        throw new Error('View toggle button not found');
    }

    const viewToggleIcon = viewToggleButton.querySelector('img');
    if (!viewToggleIcon) {
        throw new Error('View toggle icon not found');
    }

    const categoriesContainer = document.getElementById('categories');
    if (!categoriesContainer) {
        throw new Error('Categories container not found');
    }

    // Set initial view
    categoriesContainer.style.flexDirection = VIEW_CONSTANTS.DEFAULT_DIRECTION;
    viewToggleIcon.src = VIEW_CONSTANTS.ICONS.ROWS;

    // View toggle handler
    const handleViewToggle = () => {
        const isRowView = categoriesContainer.classList.toggle(VIEW_CONSTANTS.CLASSES.ROW_VIEW);
        categoriesContainer.classList.toggle(VIEW_CONSTANTS.CLASSES.COLUMN_VIEW, !isRowView);
        categoriesContainer.style.flexDirection = '';
        
        viewToggleIcon.src = isRowView 
            ? VIEW_CONSTANTS.ICONS.COLUMNS
            : VIEW_CONSTANTS.ICONS.ROWS;

        // Dispatch view change event
        viewChangeEvent.detail.layout = isRowView ? 'row' : 'column';
        document.dispatchEvent(viewChangeEvent);
    };

    viewToggleButton.addEventListener('click', handleViewToggle);

    // Return cleanup function
    return () => {
        viewToggleButton.removeEventListener('click', handleViewToggle);
    };
}

/**
 * Gets the current view layout
 * @returns {'row' | 'column'} The current view layout
 */
export function getCurrentView() {
    const categoriesContainer = document.getElementById('categories');
    return categoriesContainer?.classList.contains(VIEW_CONSTANTS.CLASSES.ROW_VIEW) 
        ? 'row' 
        : 'column';
}