/**
 * Game state constants
 * @readonly
 */
export const CONSTANTS = {
    SCORE_INCREMENT: 10,
    WRONG_ANIMATION_DELAY: 1000,
    LOCAL_STORAGE_KEY: 'categoryGames',
    EVENTS: {
        STATE_CHANGE: 'gameStateChange',
        CATEGORY_CHANGE: 'categoryChange',
        SCORE_CHANGE: 'scoreChange'
    }
};

/**
 * @typedef {Object} Category
 * @property {string} title - The category title
 * @property {string[]} answers - Array of answers for the category
 */

/**
 * Game state management class
 */
class GameStateManager {
    constructor() {
        this.hasUnsavedChanges = false;
        this.currentEditingGameId = null;
        this.categories = [];
        this.score = 0;
        
        // Create custom events
        this.stateChangeEvent = new CustomEvent(CONSTANTS.EVENTS.STATE_CHANGE, {
            bubbles: true,
            detail: { state: this }
        });
        
        this.categoryChangeEvent = new CustomEvent(CONSTANTS.EVENTS.CATEGORY_CHANGE, {
            bubbles: true,
            detail: { categories: this.categories }
        });
        
        this.scoreChangeEvent = new CustomEvent(CONSTANTS.EVENTS.SCORE_CHANGE, {
            bubbles: true,
            detail: { score: this.score }
        });
    }

    /**
     * Updates unsaved changes state
     * @param {boolean} value - New unsaved changes state
     */
    setUnsavedChanges(value) {
        this.hasUnsavedChanges = Boolean(value);
        this.dispatchStateChange();
    }

    /**
     * Gets unsaved changes state
     * @returns {boolean} Current unsaved changes state
     */
    getUnsavedChanges() {
        return this.hasUnsavedChanges;
    }

    /**
     * Sets current editing game ID
     * @param {string|null} id - Game ID
     */
    setCurrentEditingGameId(id) {
        this.currentEditingGameId = id;
        this.dispatchStateChange();
    }

    /**
     * Gets current editing game ID
     * @returns {string|null} Current game ID
     */
    getCurrentEditingGameId() {
        return this.currentEditingGameId;
    }

    /**
     * Gets all categories
     * @returns {Category[]} Copy of categories array
     */
    getCategories() {
        return [...this.categories];
    }

    /**
     * Adds a new category
     * @param {Category} category - Category to add
     */
    addCategory(category) {
        this.categories.push(category);
        this.dispatchCategoryChange();
        this.setUnsavedChanges(true);
    }

    /**
     * Removes a category
     * @param {string} categoryTitle - Title of category to remove
     */
    removeCategory(categoryTitle) {
        this.categories = this.categories.filter(cat => cat.title !== categoryTitle);
        this.dispatchCategoryChange();
        this.setUnsavedChanges(true);
    }

    /**
     * Clears all categories
     */
    clearCategories() {
        this.categories = [];
        this.dispatchCategoryChange();
        this.setUnsavedChanges(false);
    }

    /**
     * Updates game score
     * @param {number} points - Points to add (or subtract if negative)
     */
    updateScore(points) {
        this.score += points;
        document.getElementById('score').textContent = `Score: ${this.score}`;
        this.dispatchScoreChange();
    }

    /**
     * Resets game score
     */
    resetScore() {
        this.score = 0;
        document.getElementById('score').textContent = `Score: ${this.score}`;
        this.dispatchScoreChange();
    }

    /**
     * Dispatches state change event
     * @private
     */
    dispatchStateChange() {
        this.stateChangeEvent.detail.state = { ...this };
        document.dispatchEvent(this.stateChangeEvent);
    }

    /**
     * Dispatches category change event
     * @private
     */
    dispatchCategoryChange() {
        this.categoryChangeEvent.detail.categories = [...this.categories];
        document.dispatchEvent(this.categoryChangeEvent);
    }

    /**
     * Dispatches score change event
     * @private
     */
    dispatchScoreChange() {
        this.scoreChangeEvent.detail.score = this.score;
        document.dispatchEvent(this.scoreChangeEvent);
    }
}

// Create singleton instance
const gameStateInstance = new GameStateManager();

// Export methods directly (not as references to instance methods)
export const setUnsavedChanges = (value) => gameStateInstance.setUnsavedChanges(value);
export const getUnsavedChanges = () => gameStateInstance.getUnsavedChanges();
export const setCurrentEditingGameId = (id) => gameStateInstance.setCurrentEditingGameId(id);
export const getCurrentEditingGameId = () => gameStateInstance.getCurrentEditingGameId();
export const getCategories = () => gameStateInstance.getCategories();
export const addCategory = (category) => gameStateInstance.addCategory(category);
export const removeCategory = (categoryTitle) => gameStateInstance.removeCategory(categoryTitle);
export const clearCategories = () => gameStateInstance.clearCategories();

// Export GameState object
export const GameState = {
    get score() { return gameStateInstance.score; },
    updateScore: (points) => gameStateInstance.updateScore(points),
    resetScore: () => gameStateInstance.resetScore()
};

// Export instance for direct access if needed
export const gameState = gameStateInstance;