/**
 * UI element IDs and classes
 * @readonly
 */
const UI_CONSTANTS = {
    MODALS: {
        POPUP: 'popup-modal',
        UNSAVED_CHANGES: 'unsaved-changes-modal'
    },
    ELEMENTS: {
        POPUP_TITLE: 'popup-modal-title',
        POPUP_CONTENT: 'popup-modal-content',
        CATEGORY_INPUT: 'category-input',
        GAME_TITLE: 'game-title',
        CATEGORIES: 'categories',
        PLAY_CATEGORIES: 'play-categories',
        ANSWERS_POOL: 'answers-pool',
        MULTIPLE_CHOICE: 'multiple-choice-container',
        SCORE: 'score',
        TIMER: 'timer',
        PLAY_GAME_TITLE: 'play-game-title'
    }
};

/**
 * Custom event for UI state changes
 * @type {CustomEvent}
 */
export const uiStateChangeEvent = new CustomEvent('uiStateChange', {
    bubbles: true,
    detail: { type: '', elementId: '' }
});

/**
 * Shows a popup modal with the given title and content
 * @param {string} title - Modal title
 * @param {string} content - Modal content
 * @throws {Error} If required modal elements are not found
 */
export function showPopupModal(title, content) {
    const titleElement = document.getElementById(UI_CONSTANTS.ELEMENTS.POPUP_TITLE);
    const contentElement = document.getElementById(UI_CONSTANTS.ELEMENTS.POPUP_CONTENT);
    const modalElement = document.getElementById(UI_CONSTANTS.MODALS.POPUP);

    if (!titleElement || !contentElement || !modalElement) {
        throw new Error('Required modal elements not found');
    }

    titleElement.textContent = title;
    contentElement.textContent = content;
    modalElement.style.display = 'block';

    dispatchUIStateChange('modalShow', UI_CONSTANTS.MODALS.POPUP);
}

/**
 * Closes the popup modal
 */
export function closePopupModal() {
    const modal = document.getElementById(UI_CONSTANTS.MODALS.POPUP);
    if (modal) {
        modal.style.display = 'none';
        dispatchUIStateChange('modalClose', UI_CONSTANTS.MODALS.POPUP);
    }
}

/**
 * Shows the unsaved changes modal
 */
export function showUnsavedChangesModal() {
    const modal = document.getElementById(UI_CONSTANTS.MODALS.UNSAVED_CHANGES);
    if (modal) {
        modal.style.display = 'block';
        dispatchUIStateChange('modalShow', UI_CONSTANTS.MODALS.UNSAVED_CHANGES);
    }
}

/**
 * Closes the unsaved changes modal
 */
export function closeUnsavedChangesModal() {
    const modal = document.getElementById(UI_CONSTANTS.MODALS.UNSAVED_CHANGES);
    if (modal) {
        modal.style.display = 'none';
        dispatchUIStateChange('modalClose', UI_CONSTANTS.MODALS.UNSAVED_CHANGES);
    }
}

/**
 * Clears game creation input fields
 */
export function clearGameCreationFields() {
    const categoryInput = document.getElementById(UI_CONSTANTS.ELEMENTS.CATEGORY_INPUT);
    if (categoryInput) {
        categoryInput.value = '';
        dispatchUIStateChange('clearField', UI_CONSTANTS.ELEMENTS.CATEGORY_INPUT);
    }
}

/**
 * Resets all game creation fields
 */
export function newGameCreationFields() {
    const elements = {
        gameTitle: document.getElementById(UI_CONSTANTS.ELEMENTS.GAME_TITLE),
        categoryInput: document.getElementById(UI_CONSTANTS.ELEMENTS.CATEGORY_INPUT),
        categories: document.getElementById(UI_CONSTANTS.ELEMENTS.CATEGORIES)
    };

    if (elements.gameTitle) elements.gameTitle.value = '';
    if (elements.categoryInput) elements.categoryInput.value = '';
    if (elements.categories) elements.categories.innerHTML = '';

    dispatchUIStateChange('resetFields', 'gameCreation');
}

/**
 * Clears all game UI elements
 */
export function clearGameUI() {
    const elements = {
        playCategories: document.getElementById(UI_CONSTANTS.ELEMENTS.PLAY_CATEGORIES),
        answersPool: document.getElementById(UI_CONSTANTS.ELEMENTS.ANSWERS_POOL),
        multipleChoice: document.getElementById(UI_CONSTANTS.ELEMENTS.MULTIPLE_CHOICE),
        score: document.getElementById(UI_CONSTANTS.ELEMENTS.SCORE),
        timer: document.getElementById(UI_CONSTANTS.ELEMENTS.TIMER),
        gameTitle: document.getElementById(UI_CONSTANTS.ELEMENTS.PLAY_GAME_TITLE)
    };

    if (elements.playCategories) elements.playCategories.innerHTML = '';
    if (elements.answersPool) elements.answersPool.innerHTML = '';
    if (elements.multipleChoice) elements.multipleChoice.innerHTML = '';
    if (elements.score) elements.score.textContent = 'Score: 0';
    if (elements.timer) elements.timer.textContent = 'Time: 0:00';
    if (elements.gameTitle) elements.gameTitle.textContent = '';

    dispatchUIStateChange('clearUI', 'game');
}

/**
 * Dispatches UI state change event
 * @param {string} type - Type of UI change
 * @param {string} elementId - ID of affected element
 * @private
 */
function dispatchUIStateChange(type, elementId) {
    uiStateChangeEvent.detail.type = type;
    uiStateChangeEvent.detail.elementId = elementId;
    document.dispatchEvent(uiStateChangeEvent);
}
