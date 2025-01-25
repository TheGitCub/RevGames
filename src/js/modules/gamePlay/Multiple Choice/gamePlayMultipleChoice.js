// Multiple choice game management
import { showGamePlayScreen } from '../../screenManager.js';
import { showPopupModal } from '../../uiManager.js';
import { startTimer, stopTimer } from '../../timerManager.js';
import { CONSTANTS } from '../../gameStateManager.js';

/**
 * @typedef {Object} Question
 * @property {string} text - Question text
 * @property {string[]} options - Available answer options
 * @property {string} correctAnswer - The correct answer
 * @property {boolean} answered - Whether question has been answered
 * @property {boolean} skipped - Whether question has been skipped
 * @property {string} [selectedAnswer] - User's selected answer
 */

/** @type {Question[]} */
let questions = [];
let score = 0;
let currentQuestionIndex = 0;
let gameActive = false;

const SCORE_PER_CORRECT = 10;
const QUESTION_TRANSITION_DELAY = 1500;

/**
 * Initialize and start multiple choice game
 * @param {string} gameId - ID of the game to play
 * @throws {Error} If game data is invalid
 */
export function playMultipleChoiceGame(gameId) {
    try {
        const game = loadGame(gameId);
        if (!validateGame(game)) return;

        initializeGameState();
        showGamePlayScreen('multiple-choice');
        setupGameUI(game);
        generateQuestions(game.categories);
        showCurrentQuestion();
        startTimer();
        gameActive = true;
    } catch (error) {
        showPopupModal('Error', `Failed to start game: ${error.message}`);
        console.error('Game start error:', error);
    }
}

/**
 * Clean up game state when navigating away
 */
export function cleanupGame() {
    if (gameActive) {
        stopTimer();
        score = 0;
        currentQuestionIndex = 0;
        questions = [];
        gameActive = false;
    }
}

/**
 * Load game data
 * @param {string} gameId - ID of the game to load
 * @returns {Object|null} Game data object
 */
function loadGame(gameId) {
    const savedGames = JSON.parse(localStorage.getItem(CONSTANTS.LOCAL_STORAGE_KEY) || '[]');
    return savedGames.find(g => g.id === gameId);
}

/**
 * Validate game data
 * @param {Object} game - Game data to validate
 * @returns {boolean} Whether game is valid
 */
function validateGame(game) {
    if (!game) {
        showPopupModal('Error', 'Game not found');
        return false;
    }

    if (!game.categories?.some(cat => cat.answers?.length > 0)) {
        showPopupModal('Invalid Game', 'This game has no answers to create questions from');
        return false;
    }

    return true;
}

/**
 * Initialize game state
 */
function initializeGameState() {
    score = 0;
    currentQuestionIndex = 0;
    questions = [];
    document.getElementById('score').textContent = 'Score: 0';
}

/**
 * Setup game UI
 * @param {Object} game - Game data
 */
function setupGameUI(game) {
    document.getElementById('play-game-title').textContent = game.title;
}

/**
 * Generate questions from categories
 * @param {Array} categories - Array of category objects
 */
function generateQuestions(categories) {
    questions = [];
    
    // First, standardize and combine answers
    const standardizedAnswers = categories.flatMap(category => {
        if (!category.answers) return [];
        
        return category.answers.map(answer => {
            const answerText = typeof answer === 'string' ? answer : answer.text;
            const answerId = typeof answer === 'string' ? null : answer.id;
            
            return {
                id: answerId,
                text: answerText,
                category: category.title
            };
        });
    });
    
    // Group duplicate answers
    const groupedAnswers = standardizedAnswers.reduce((acc, current) => {
        const existing = acc.find(a => a.text === current.text);
        if (existing) {
            if (!existing.categories.includes(current.category)) {
                existing.categories.push(current.category);
            }
        } else {
            acc.push({
                ...current,
                categories: [current.category]
            });
        }
        return acc;
    }, []);
    
    // Generate questions for each answer-category pair
    groupedAnswers.forEach(answer => {
        answer.categories.forEach(category => {
            // Generate wrong options (excluding duplicates)
            const wrongOptions = groupedAnswers
                .filter(a => a.text !== answer.text)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3)
                .map(a => a.text);
            
            // Create question
            questions.push({
                category: category,
                correctAnswer: answer.text,
                options: [...wrongOptions, answer.text].sort(() => Math.random() - 0.5),
                answered: false
            });
        });
    });
    
    // Shuffle questions order
    questions.sort(() => Math.random() - 0.5);
}

/**
 * Show current question
 */
function showCurrentQuestion() {
    const container = document.getElementById('multiple-choice-container');
    container.innerHTML = '';
    
    if (currentQuestionIndex >= questions.length) {
        handleGameComplete();
        return;
    }
    
    const questionDiv = createQuestionElement();
    const navigationDiv = createNavigationElement();
    
    questionDiv.appendChild(navigationDiv);
    container.appendChild(questionDiv);
}

/**
 * Create question element
 * @returns {HTMLElement} Question container element
 */
function createQuestionElement() {
    const question = questions[currentQuestionIndex];
    const questionDiv = document.createElement('div');
    questionDiv.classList.add('multiple-choice-question', 'play-category');
    
    // Add progress indicator
    const progressDiv = document.createElement('div');
    progressDiv.classList.add('game-stats');
    progressDiv.innerHTML = `
        <span>Question ${currentQuestionIndex + 1} of ${questions.length}</span>
        <span id="question-score">Score: ${score}</span>
    `;
    questionDiv.appendChild(progressDiv);
    
    // Add question text
    const questionText = document.createElement('h3');
    questionText.textContent = `Which answer belongs to "${question.category}"?`;
    questionDiv.appendChild(questionText);
    
    // Add options
    const optionsContainer = createOptionsContainer(question);
    questionDiv.appendChild(optionsContainer);
    
    return questionDiv;
}

/**
 * Create options container
 * @param {Object} question - Question data
 * @returns {HTMLElement} Options container element
 */
function createOptionsContainer(question) {
    const optionsContainer = document.createElement('div');
    optionsContainer.classList.add('options-container', 'play-answers-list');
    
    if (question.answered) {
        optionsContainer.classList.add('answered');
        optionsContainer.style.pointerEvents = 'none';
    }
    
    question.options.forEach(option => {
        const button = createOptionButton(option, question);
        optionsContainer.appendChild(button);
    });
    
    return optionsContainer;
}

/**
 * Create option button
 * @param {string} option - Option text
 * @param {Object} question - Question data
 * @returns {HTMLElement} Option button element
 */
function createOptionButton(option, question) {
    const button = document.createElement('button');
    button.classList.add('option-button', 'play-answer');
    button.textContent = option;
    
    if (!question.answered) {
        button.addEventListener('click', () => handleAnswer(button, option === question.correctAnswer));
    } else {
        button.disabled = true;
        if (option === question.correctAnswer) {
            button.classList.add('correct');
        } else if (button.textContent === question.selectedAnswer) {
            button.classList.add('wrong');
        }
    }
    
    return button;
}

/**
 * Create navigation element
 * @returns {HTMLElement} Navigation container element
 */
function createNavigationElement() {
    const navContainer = document.createElement('nav');
    navContainer.classList.add('question-navigation');
    navContainer.setAttribute('aria-label', 'Question navigation');
    
    const navList = document.createElement('ul');
    navList.classList.add('pagination-list');
    
    // Add previous button
    navList.appendChild(createNavigationButton('prev'));
    
    // Add page numbers
    addPaginationNumbers(navList);
    
    // Add next button
    navList.appendChild(createNavigationButton('next'));
    
    navContainer.appendChild(navList);
    return navContainer;
}

/**
 * Add pagination numbers to navigation
 * @param {HTMLElement} navList - Navigation list element
 */
function addPaginationNumbers(navList) {
    const totalPages = questions.length;
    const minButtons = 9; // Always show exactly 9 buttons (including ellipsis)
    const currentPage = currentQuestionIndex;
    
    if (totalPages <= minButtons) {
        // Show all pages if total is less than min buttons
        for (let i = 0; i < totalPages; i++) {
            navList.appendChild(createNumberButton(i));
        }
        return;
    }
    
    // Calculate the range of visible page numbers
    let middleStart = currentPage - 2;
    let middleEnd = currentPage + 2;
    
    // Adjust range if it goes beyond bounds
    if (middleStart < 2) {
        middleEnd = 6;  // Show pages 2-6 at start
        middleStart = 2;
    } else if (middleEnd > totalPages - 3) {
        middleStart = totalPages - 7; // Show last 5 numbered pages before last page
        middleEnd = totalPages - 3;
    }
    
    // First page
    navList.appendChild(createNumberButton(0));
    
    // Left ellipsis or number
    if (middleStart > 2) {
        navList.appendChild(createEllipsisButton());
    } else {
        navList.appendChild(createNumberButton(1));
    }
    
    // Middle pages (always show 5 numbers)
    for (let i = middleStart; i <= middleEnd; i++) {
        navList.appendChild(createNumberButton(i));
    }
    
    // Right ellipsis or number
    if (middleEnd < totalPages - 3) {
        navList.appendChild(createEllipsisButton());
    } else {
        navList.appendChild(createNumberButton(totalPages - 2));
    }
    
    // Last page
    navList.appendChild(createNumberButton(totalPages - 1));
}

/**
 * Create navigation button (prev/next)
 * @param {string} type - Button type ('prev' or 'next')
 * @returns {HTMLElement} Navigation button element
 */
function createNavigationButton(type) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.classList.add('pagination-arrow');
    
    const isPrev = type === 'prev';
    const disabled = isPrev ? 
        currentQuestionIndex === 0 : 
        currentQuestionIndex === questions.length - 1;
    
    button.disabled = disabled;
    button.setAttribute('aria-disabled', disabled);
    button.innerHTML = `
        <img src="node_modules/feather-icons/dist/icons/chevron-${isPrev ? 'left' : 'right'}.svg" 
             alt="${isPrev ? 'Previous' : 'Next'}" 
             class="icon">
    `;
    
    if (!disabled) {
        button.addEventListener('click', () => {
            if (!isPrev) {
                markQuestionSkipped();
            }
            currentQuestionIndex += isPrev ? -1 : 1;
            showCurrentQuestion();
        });
    }
    
    item.appendChild(button);
    return item;
}

/**
 * Create number button for pagination
 * @param {number} index - Question index
 * @returns {HTMLElement} Number button element
 */
function createNumberButton(index) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.classList.add('pagination-number');
    button.textContent = index + 1;
    button.setAttribute('aria-label', `Question ${index + 1}`);

    if (index === currentQuestionIndex) {
        button.classList.add('current');
        button.setAttribute('aria-current', 'page');
    }
    
    const question = questions[index];
    if (question.answered) {
        button.classList.add('answered', 
            question.selectedAnswer === question.correctAnswer ? 'correct' : 'wrong');
    }
    if (question.skipped) {
        button.classList.add('skipped');
    }

    button.addEventListener('click', () => {
        markQuestionSkipped();
        currentQuestionIndex = index;
        showCurrentQuestion();
    });

    item.appendChild(button);
    return item;
}

/**
 * Create ellipsis button for pagination
 * @returns {HTMLElement} Ellipsis button element
 */
function createEllipsisButton() {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.classList.add('pagination-number');
    button.textContent = '...';
    button.disabled = true;
    item.appendChild(button);
    return item;
}

/**
 * Handle answer selection
 * @param {HTMLElement} button - Selected option button
 * @param {boolean} isCorrect - Whether answer is correct
 */
function handleAnswer(button, isCorrect) {
    const question = questions[currentQuestionIndex];
    question.answered = true;
    question.selectedAnswer = button.textContent;
    question.skipped = false; // Clear skipped status when answered
    
    const optionsContainer = button.parentElement;
    optionsContainer.classList.add('answered');
    optionsContainer.style.pointerEvents = 'none';
    
    const allButtons = optionsContainer.querySelectorAll('button');
    allButtons.forEach(btn => btn.disabled = true);
    
    if (isCorrect) {
        button.classList.add('correct');
        updateScore(score + 10);
    } else {
        button.classList.add('wrong');
        allButtons.forEach(btn => {
            if (btn.textContent === question.correctAnswer) {
                btn.classList.add('correct');
            }
        });
    }
    
    // Auto-advance like normal navigation after 1.5 seconds
    setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            showCurrentQuestion();
        } else {
            checkGameCompletion();
        }
    }, 1500);
}

/**
 * Update score display
 * @param {number} newScore - New score value
 */
function updateScore(newScore) {
    score = newScore;
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('question-score').textContent = `Score: ${score}`;
}

/**
 * Check if game is complete
 */
function checkGameCompletion() {
    if (questions.every(q => q.answered)) {
        handleGameComplete();
    }
}

/**
 * Handle game completion
 */
function handleGameComplete() {
    stopTimer();
    showPopupModal('Game Complete', `Final Score: ${score}`);
}

/**
 * Mark current question as skipped if not answered
 */
function markQuestionSkipped() {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion.answered && !currentQuestion.skipped) {
        currentQuestion.skipped = true;
    }
}
