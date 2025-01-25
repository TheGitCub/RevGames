import { CONSTANTS } from './gameStateManager.js';
import { closeFilterPanel, loadGamesLibrary, getHasUnsavedChanges } from './gameLibrary.js';
import { clearGameUI } from './uiManager.js';
import { stopTimer } from './timerManager.js';
import { cleanupGame as cleanupCategoriesGame } from './gamePlay/Categories/gamePlayCategories.js';
import { cleanupGame as cleanupMultipleChoiceGame } from './gamePlay/Multiple Choice/gamePlayMultipleChoice.js';

/**
 * Navigate to home screen
 */
export function navigateToHome() {
    cleanupCategoriesGame();
    cleanupMultipleChoiceGame();
    
    // Stop any running game timer
    stopTimer();
    
    // Hide back button
    document.getElementById('back-to-home').style.display = 'none';
    
    // Show home screen
    document.getElementById('home-screen').style.display = 'block';
    document.getElementById('game-creation-screen').style.display = 'none';
    document.getElementById('play-screen').style.display = 'none';
    
    // Update header title
    document.getElementById('main-title').style.display = 'block';
    document.getElementById('creation-title').style.display = 'none';
    document.getElementById('gameplay-title').style.display = 'none';
    loadGamesLibrary();
}

/**
 * Show game creation screen
 */
export function showGameCreationScreen() {
    closeFilterPanel();
    // Stop any running game timer
    stopTimer();
    
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('game-creation-screen').style.display = 'block';
    document.getElementById('play-screen').style.display = 'none';
    
    // Show back button
    document.getElementById('back-to-home').style.display = 'block';
    
    // Update header title
    document.getElementById('main-title').style.display = 'none';
    document.getElementById('creation-title').style.display = 'block';
    document.getElementById('gameplay-title').style.display = 'none';
}

/**
 * Show game play screen
 * @param {string} mode - Game mode ('categories' or 'multiple-choice')
 */
export function showGamePlayScreen(mode) {
    // Clear previous game UI
    clearGameUI();
    
    // Hide other screens
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('game-creation-screen').style.display = 'none';
    document.getElementById('play-screen').style.display = 'block';
    
    // Show/hide game mode containers based on mode
    document.getElementById('play-categories').style.display = mode === 'categories' ? 'grid' : 'none';
    document.getElementById('answers-pool').style.display = mode === 'categories' ? 'flex' : 'none';
    document.getElementById('multiple-choice-container').style.display = mode === 'multiple-choice' ? 'flex' : 'none';
    
    // Show back button
    document.getElementById('back-to-home').style.display = 'block';
    
    // Update header title
    document.getElementById('main-title').style.display = 'none';
    document.getElementById('creation-title').style.display = 'none';
    document.getElementById('gameplay-title').style.display = 'block';
}

/**
 * Show home screen with library refresh
 */
export function showHomeScreen() {
    closeFilterPanel();
    updateTitleVisibility('block', 'none', 'none');
    document.getElementById('back-to-home').style.display = 'none';
    updateScreenVisibility('block', 'none', 'none');
    loadGamesLibrary();
}

/**
 * Update title visibility
 * @param {string} main - Main title display value
 * @param {string} creation - Creation title display value
 * @param {string} gameplay - Gameplay title display value
 */
export function updateTitleVisibility(main, creation, gameplay) {
    document.getElementById('main-title').style.display = main;
    document.getElementById('creation-title').style.display = creation;
    document.getElementById('gameplay-title').style.display = gameplay;
}

/**
 * Update screen visibility
 * @param {string} home - Home screen display value
 * @param {string} creation - Creation screen display value
 * @param {string} play - Play screen display value
 */
export function updateScreenVisibility(home, creation, play) {
    document.getElementById('home-screen').style.display = home;
    document.getElementById('game-creation-screen').style.display = creation;
    document.getElementById('play-screen').style.display = play;
} 