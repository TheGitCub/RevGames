import { CONSTANTS } from '../../gameStateManager.js';
import { showGamePlayScreen } from '../../screenManager.js';
import { startTimer, stopTimer } from '../../timerManager.js';
import { showPopupModal } from '../../uiManager.js';

export let score = 0;
let gameActive = false;

/**
 * Start a new category sorting game
 * @param {string} gameId - ID of the game to play
 */
export function playGame(gameId) {
    const savedGames = JSON.parse(localStorage.getItem(CONSTANTS.LOCAL_STORAGE_KEY) || '[]');
    const game = savedGames.find(g => g.id === gameId);
    
    if (!validateGame(game)) return;

    initializeGameState();
    showGamePlayScreen('categories');
    setupGameUI(game);
    startTimer();
    gameActive = true;
}

/**
 * Clean up game state when navigating away
 */
export function cleanupGame() {
    if (gameActive) {
        stopTimer();
        score = 0;
        gameActive = false;
        
        // Clear UI
        const pool = document.getElementById('answers-pool');
        const categories = document.getElementById('play-categories');
        if (pool) pool.innerHTML = '';
        if (categories) categories.innerHTML = '';
    }
}

/**
 * Validate game data
 * @param {Object} game - Game data object
 * @returns {boolean} - Whether game is valid
 */
function validateGame(game) {
    if (!game) {
        showPopupModal('Error', 'Game not found');
        return false;
    }

    // Validate game has categories
    if (!game.categories?.length) {
        showPopupModal('Invalid Game', 'This game has no categories');
        return false;
    }

    // Validate categories have answers
    const hasAnswers = game.categories.some(category => 
        category.answers?.length > 0
    );
    
    if (!hasAnswers) {
        showPopupModal('Invalid Game', 'This game has no answers in any category');
        return false;
    }

    return true;
}

/**
 * Initialize game state
 */
function initializeGameState() {
    score = 0;
    document.getElementById('score').textContent = 'Score: 0';
}

/**
 * Setup game UI components
 * @param {Object} game - Game data object
 */
function setupGameUI(game) {
    document.getElementById('play-game-title').textContent = game.title;
    setupPlayCategories(game.categories);
    setupAnswersPool(game.categories);
}

/**
 * Setup category containers
 * @param {Array} categories - Array of category objects
 */
function setupPlayCategories(categories) {
    const container = document.getElementById('play-categories');
    container.innerHTML = '';
    
    categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.classList.add('play-category');
        
        const categoryTitle = document.createElement('h3');
        categoryTitle.textContent = category.title;
        
        const answersList = document.createElement('div');
        answersList.classList.add('play-answers-list');
        answersList.setAttribute('data-category', category.title);
        answersList.setAttribute('ondrop', 'handlePlayDrop(event)');
        answersList.setAttribute('ondragover', 'allowDrop(event)');
        
        categoryDiv.appendChild(categoryTitle);
        categoryDiv.appendChild(answersList);
        container.appendChild(categoryDiv);
    });
}

/**
 * Setup answers pool with grouped answers
 * @param {Array} categories - Array of category objects
 */
function setupAnswersPool(categories) {
    const pool = document.getElementById('answers-pool');
    pool.innerHTML = '';
    
    // Standardize and combine answers
    const combinedAnswers = combineAnswers(categories);
    
    // Shuffle answers
    shuffleArray(combinedAnswers);
    
    // Create answer elements
    combinedAnswers.forEach((answer, index) => {
        createAnswerElement(pool, answer, index);
    });
}

/**
 * Combine and standardize answers from categories
 * @param {Array} categories - Array of category objects
 * @returns {Array} Combined answer objects
 */
function combineAnswers(categories) {
    // First, standardize all answers
    const standardizedAnswers = categories.flatMap(category => {
        if (!category.answers) return [];
        
        return category.answers.map(answer => {
            const answerText = typeof answer === 'string' ? answer : answer.text;
            const answerId = typeof answer === 'string' ? null : answer.id;
            
            return {
                id: answerId,
                text: answerText,
                associations: [{ 
                    category: category.title,
                    id: answerId 
                }]
            };
        });
    });
    
    // Then combine duplicates
    return standardizedAnswers.reduce((acc, current) => {
        const existing = acc.find(a => a.text === current.text);
        if (existing) {
            existing.associations.push(...current.associations);
        } else {
            acc.push(current);
        }
        return acc;
    }, []);
}

/**
 * Create draggable answer element
 * @param {HTMLElement} container - Container element
 * @param {Object} answer - Answer data
 * @param {number} index - Answer index
 */
function createAnswerElement(container, answer, index) {
    const answerDiv = document.createElement('div');
    answerDiv.classList.add('play-answer');
    answerDiv.setAttribute('draggable', true);
    answerDiv.id = `answer-${answer.id || index}`;
    answerDiv.setAttribute('data-associations', JSON.stringify(answer.associations));
    answerDiv.style.position = 'relative';
    
    // Add text content
    answerDiv.appendChild(document.createTextNode(answer.text));
    
    // Add count box if multiple associations
    if (answer.associations.length > 1) {
        const countBox = document.createElement('span');
        countBox.classList.add('remaining-count-box');
        countBox.textContent = answer.associations.length;
        answerDiv.appendChild(countBox);
    }
    
    answerDiv.setAttribute('ondragstart', 'drag(event)');
    container.appendChild(answerDiv);
}

/**
 * Shuffle array in place
 * @param {Array} array - Array to shuffle
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Make these functions global for the ondrop/ondragstart attributes
window.handlePlayDrop = function(event) {
    event.preventDefault();
    const data = event.dataTransfer.getData('text');
    const draggedElement = document.getElementById(data);
    const targetCategory = event.target.closest('.play-answers-list');
    
    if (!targetCategory || !draggedElement) return;
    
    handleAnswerDrop(draggedElement, targetCategory);
};

/**
 * Handle answer drop
 * @param {HTMLElement} draggedElement - Dragged answer element
 * @param {HTMLElement} targetCategory - Target category container
 */
function handleAnswerDrop(draggedElement, targetCategory) {
    const targetCategoryTitle = targetCategory.getAttribute('data-category');
    const associations = JSON.parse(draggedElement.getAttribute('data-associations'));
    const matchingAssociation = associations.find(a => a.category === targetCategoryTitle);
    
    if (matchingAssociation) {
        handleCorrectAnswer(draggedElement, targetCategory, matchingAssociation, associations);
    } else {
        showWrongAnswerFeedback(draggedElement);
    }
}

/**
 * Handle correct answer placement
 * @param {HTMLElement} draggedElement - Dragged answer element
 * @param {HTMLElement} targetCategory - Target category container
 * @param {Object} matchingAssociation - Matching association data
 * @param {Array} associations - All associations for the answer
 */
function handleCorrectAnswer(draggedElement, targetCategory, matchingAssociation, associations) {
    // Create placed answer
    const placedAnswer = document.createElement('div');
    placedAnswer.classList.add('play-answer', 'correct');
    placedAnswer.setAttribute('draggable', false);
    placedAnswer.id = `placed-${matchingAssociation.id || Date.now()}`;
    placedAnswer.textContent = draggedElement.childNodes[0].textContent;
    targetCategory.appendChild(placedAnswer);
    
    // Update score
    score += 10;
    document.getElementById('score').textContent = `Score: ${score}`;
    
    // Handle remaining associations
    const remainingAssociations = associations.filter(a => a !== matchingAssociation);
    updateDraggedElement(draggedElement, remainingAssociations);
    
    checkGameCompletion();
}

/**
 * Update dragged element state
 * @param {HTMLElement} element - Element to update
 * @param {Array} remainingAssociations - Remaining associations
 */
function updateDraggedElement(element, remainingAssociations) {
    const countBox = element.querySelector('.remaining-count-box');
    
    if (remainingAssociations.length > 1) {
        element.setAttribute('data-associations', JSON.stringify(remainingAssociations));
        if (countBox) countBox.textContent = remainingAssociations.length;
    } else if (remainingAssociations.length === 1) {
        element.setAttribute('data-associations', JSON.stringify(remainingAssociations));
        if (countBox) countBox.remove();
    } else {
        element.remove();
    }
}

/**
 * Show wrong answer feedback
 * @param {HTMLElement} element - Wrong answer element
 */
function showWrongAnswerFeedback(element) {
    element.classList.add('wrong');
    setTimeout(() => element.classList.remove('wrong'), 1000);
}

/**
 * Check if game is complete
 */
export function checkGameCompletion() {
    const pool = document.getElementById('answers-pool');
    if (pool.children.length === 0) {
        stopTimer();
        showPopupModal('Game Complete', `Final Score: ${score}`);
    }
}

// Global drag and drop handlers
window.allowDrop = function(event) {
    event.preventDefault();
};

window.drag = function(event) {
    event.dataTransfer.setData('text', event.target.id);
};