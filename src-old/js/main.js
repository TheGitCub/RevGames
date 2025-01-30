import { drag, drop, allowDrop, dragEnd } from './modules/dragAndDrop.js';
import { setCurrentEditingGameId, CONSTANTS } from './modules/gameStateManager.js';
import { showPopupModal, clearGameUI } from './modules/uiManager.js';
import { initializeImportExport } from './modules/importExport.js';
import { initializeEventListeners } from './modules/eventHandlers.js';
import { initializeTheme } from './utils/themeToggle.js';
import { initializeViewToggle } from './utils/viewToggle.js';
import { loadGamesLibrary } from './modules/gameLibrary.js';

// Initialize the application when DOM is ready
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // Make drag & drop functions globally available 
        window.drag = drag;
        window.drop = drop;
        window.allowDrop = allowDrop;
        window.dragEnd = dragEnd;

        // Initialize game library
        await loadGamesLibrary();

        // Initialize core modules
        initializeEventListeners();
        initializeImportExport();
        
        // Initialize UI utilities
        const cleanupTheme = initializeTheme();
        const cleanupViewToggle = initializeViewToggle();

    } catch (error) {
        console.error('Failed to initialize application:', error);
        showPopupModal('Error', 'Failed to initialize application. Please refresh the page.');
    }
});