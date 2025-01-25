import { loadGamesLibrary } from './gameLibrary.js';
import { loadGame, saveGame } from './gameCreation.js';
import { handleCategoryDelete, handleDuplicateCategory, addCategory, handleCategoryEnter } from './categoryManagement.js';
import { showUnsavedChangesModal, closeUnsavedChangesModal } from './uiManager.js';
import { getUnsavedChanges, setUnsavedChanges } from './gameStateManager.js';
import { navigateToHome, showGameCreationScreen } from './screenManager.js';
import { stopTimer } from './timerManager.js';
import { getHasUnsavedChanges, setHasUnsavedChanges } from './gameLibrary.js';

export function initializeEventListeners() {
    // Category management
    document.getElementById('category-input')?.addEventListener('keydown', handleCategoryEnter);
    
    document.getElementById('add-category-button')?.addEventListener('click', () => {
        const categoryInput = document.getElementById('category-input');
        if (categoryInput) {
            addCategory();
        }
    });
    
    document.getElementById('categories')?.addEventListener('click', (e) => {
        const target = e.target;
        if (target.matches('.delete-category-btn')) {
            handleCategoryDelete(target);
            setHasUnsavedChanges(true);
        } else if (target.matches('.duplicate-category-btn')) {
            handleDuplicateCategory(target);
            setHasUnsavedChanges(true);
        }
    });

    // Modal handlers
    document.getElementById('modal-confirm-btn')?.addEventListener('click', () => {
        // Handle modal confirmation
        const modal = document.getElementById('category-conflict-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    });

    document.getElementById('modal-cancel-btn')?.addEventListener('click', () => {
        const modal = document.getElementById('category-conflict-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    });

    // File operations
    document.getElementById("load-file-input")?.addEventListener("change", loadGame);
    document.getElementById("primary-save-game-button")?.addEventListener("click", saveGame);
    document.getElementById("game-title")?.addEventListener("input", () => {
        setHasUnsavedChanges(true);
    });

    // Navigation
    document.getElementById('create-game-btn')?.addEventListener('click', () => {
        newGameCreationFields();
        showGameCreationScreen();
    });

    document.getElementById('back-to-home')?.addEventListener('click', () => {
        if (getHasUnsavedChanges()) {
            showUnsavedChangesModal();
        } else {
            navigateToHome();
        }
    });

    document.getElementById("discard-changes-btn")?.addEventListener("click", () => {
        setHasUnsavedChanges(false);
        closeUnsavedChangesModal();
        navigateToHome();
    });

    document.getElementById("reminder-save-changes-button")?.addEventListener("click", () => {
        document.getElementById("primary-save-game-button")?.click();
        closeUnsavedChangesModal();
    });

    document.getElementById('back-from-play')?.addEventListener('click', () => {
        const playScreen = document.getElementById('play-screen');
        const homeScreen = document.getElementById('home-screen');
        if (playScreen) playScreen.style.display = 'none';
        if (homeScreen) homeScreen.style.display = 'block';
        stopTimer();
    });
}

function newGameCreationFields() {
    // Reset game creation fields
    const gameTitleInput = document.getElementById('game-title');
    const categoryInput = document.getElementById('category-input');
    const categoriesContainer = document.getElementById('categories');
    
    if (gameTitleInput) gameTitleInput.value = '';
    if (categoryInput) categoryInput.value = '';
    if (categoriesContainer) categoriesContainer.innerHTML = '';
}
