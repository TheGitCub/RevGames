import { CONSTANTS } from '../gameStateManager.js';
import { showPopupModal } from '../uiManager.js';
import { startTimer, stopTimer } from '../timerManager.js';

/**
 * Base game state
 */
export let gameState = {
    score: 0,
    gameActive: false
};

/**
 * Load game data by ID
 * @param {string} gameId 
 * @returns {Object|null}
 */
export function loadGame(gameId) {
    const savedGames = JSON.parse(localStorage.getItem(CONSTANTS.LOCAL_STORAGE_KEY) || '[]');
    return savedGames.find(g => g.id === gameId);
}

/**
 * Validate base game structure
 * @param {Object} game 
 * @returns {boolean}
 */
export function validateGame(game) {
    if (!game) {
        showPopupModal('Error', 'Game not found');
        return false;
    }

    if (!game.categories?.length) {
        showPopupModal('Invalid Game', 'This game has no categories');
        return false;
    }

    const hasAnswers = game.categories.some(category => 
        category.answers?.length > 0
    );
    
    if (!hasAnswers) {
        showPopupModal('Invalid Game', 'This game has no answers to create questions from');
        return false;
    }

    return true;
}

/**
 * Initialize basic game state
 */
export function initializeGameState() {
    gameState.score = 0;
    gameState.gameActive = true;
    document.getElementById('score').textContent = 'Score: 0';
}

/**
 * Clean up game state
 */
export function cleanupGameState() {
    if (gameState.gameActive) {
        stopTimer();
        gameState.score = 0;
        gameState.gameActive = false;
    }
}

/**
 * Update score display
 * @param {number} points 
 */
export function updateScore(points) {
    gameState.score += points;
    document.getElementById('score').textContent = `Score: ${gameState.score}`;
    const questionScore = document.getElementById('question-score');
    if (questionScore) {
        questionScore.textContent = `Score: ${gameState.score}`;
    }
}

/**
 * Start game with common initialization
 * @param {string} gameId 
 * @param {string} gameType 
 * @returns {Object|null}
 */
export function startGame(gameId, gameType) {
    const game = loadGame(gameId);
    if (!validateGame(game)) return null;

    initializeGameState();
    showGamePlayScreen(gameType);
    setupGameUI(game);
    startTimer();
    
    return game;
}

/**
 * Setup basic game UI
 * @param {Object} game 
 */
export function setupGameUI(game) {
    document.getElementById('play-game-title').textContent = game.title;
}

/**
 * Handle game completion
 */
export function handleGameComplete() {
    stopTimer();
    showPopupModal('Game Complete', `Final Score: ${gameState.score}`);
}

/**
 * Shuffle array in place
 * @param {Array} array 
 */
export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
