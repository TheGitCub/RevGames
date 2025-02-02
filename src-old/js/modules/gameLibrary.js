import { CONSTANTS, setCurrentEditingGameId, clearCategories, gameState } from './gameStateManager.js';
import { showGameCreationScreen } from './screenManager.js';
import { addCategory, addAnswerToCategory } from './categoryManagement.js';
import { playGame } from './gamePlay/Categories/gamePlayCategories.js';
import { playMultipleChoiceGame } from './gamePlay/Multiple Choice/gamePlayMultipleChoice.js';
import { showPopupModal } from './uiManager.js';

// Make functions globally available for HTML event handlers
window.playGame = playGame;
window.editGame = editGame;
window.duplicateGame = duplicateGame;
window.deleteGame = deleteGame;

let hasUnsavedChanges = false;

// Add state for filtering
const filterState = {
    isOpen: false,
    searchTerm: '',
    sortOrder: 'name-asc'
};

/**
 * Initialize library event listeners
 */
function initializeLibraryListeners() {
    // Listen for game state changes
    document.addEventListener(CONSTANTS.EVENTS.STATE_CHANGE, (event) => {
        if (event.detail?.type === 'save' || 
            event.detail?.type === 'update' || 
            event.detail?.type === 'delete') {
            loadGamesLibrary();
        }
    });

    // Filter button click handler
    document.getElementById('filter-games-btn')?.addEventListener('click', toggleFilterPanel);

    // Search input handler
    document.getElementById('search-games')?.addEventListener('input', (e) => {
        filterState.searchTerm = e.target.value.toLowerCase();
        loadGamesLibrary();
    });

    // Sort select handler
    document.getElementById('sort-games')?.addEventListener('change', (e) => {
        filterState.sortOrder = e.target.value;
        loadGamesLibrary();
    });
}

/**
 * Closes the filter panel
 */
export function closeFilterPanel() {
    const filterPanel = document.getElementById('filter-panel');
    const filterButton = document.getElementById('filter-games-btn');
    
    filterState.isOpen = false;
    
    if (filterPanel) {
        filterPanel.style.display = 'none';
    }
    
    if (filterButton) {
        filterButton.classList.remove('active');
    }
}

/**
 * Toggle filter panel visibility
 */
function toggleFilterPanel() {
    const filterPanel = document.getElementById('filter-panel');
    const filterButton = document.getElementById('filter-games-btn');
    
    filterState.isOpen = !filterState.isOpen;
    
    if (filterPanel) {
        filterPanel.style.display = filterState.isOpen ? 'block' : 'none';
    }
    
    if (filterButton) {
        filterButton.classList.toggle('active', filterState.isOpen);
    }
}

/**
 * Deletes a game from storage
 * @param {string} gameId - ID of game to delete
 */
export function deleteGame(gameId) {
    const savedGames = JSON.parse(localStorage.getItem(CONSTANTS.LOCAL_STORAGE_KEY) || '[]');
    const updatedGames = savedGames.filter(g => g.id !== gameId);
    localStorage.setItem(CONSTANTS.LOCAL_STORAGE_KEY, JSON.stringify(updatedGames));
    loadGamesLibrary();
}

/**
 * Loads and displays the games library with filtering and sorting
 */
export function loadGamesLibrary() {
    const gamesGrid = document.getElementById('games-grid');
    if (!gamesGrid) return;
    
    gamesGrid.innerHTML = '';
    
    let savedGames = JSON.parse(localStorage.getItem(CONSTANTS.LOCAL_STORAGE_KEY) || '[]');

    // Apply search filter
    if (filterState.searchTerm) {
        savedGames = savedGames.filter(game => 
            game.title.toLowerCase().includes(filterState.searchTerm)
        );
    }

    // Apply sorting
    savedGames.sort((a, b) => {
        switch (filterState.sortOrder) {
            case 'name-asc':
                return a.title.localeCompare(b.title);
            case 'name-desc':
                return b.title.localeCompare(a.title);
            case 'date-new':
                return parseInt(b.id) - parseInt(a.id);
            case 'date-old':
                return parseInt(a.id) - parseInt(b.id);
            default:
                return 0;
        }
    });
    
    if (savedGames.length === 0) {
        showEmptyState(gamesGrid);
        return;
    }

    savedGames.forEach(game => {
        const gameCard = createGameCard(game);
        gamesGrid.appendChild(gameCard);
    });
}

/**
 * Shows empty state when no games exist
 * @param {HTMLElement} container - Container element
 */
function showEmptyState(container) {
    const emptyState = document.createElement('div');
    emptyState.classList.add('empty-state');
    emptyState.innerHTML = `
        <h3>No Games Yet</h3>
        <p>Create your first game to get started!</p>
    `;
    container.appendChild(emptyState);
}

/**
 * Creates a game card element
 * @param {Object} game - Game data
 * @returns {HTMLElement} Game card element
 */
function createGameCard(game) {
    const card = document.createElement('div');
    card.classList.add('game-card');
    
    const title = document.createElement('h3');
    title.textContent = game.title;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('game-card-buttons');
    
    // Play button with options
    const playButton = document.createElement('button');
    playButton.classList.add('play-button');
    
    const playIcon = document.createElement('img');
    playIcon.src = "node_modules/feather-icons/dist/icons/play.svg";
    playIcon.alt = "Play";
    playIcon.classList.add('icon', 'play-icon');
    
    const playOptions = document.createElement('div');
    playOptions.classList.add('play-options');
    
    // Categories mode
    const categoriesButton = document.createElement('div');
    categoriesButton.classList.add('play-option');
    categoriesButton.innerHTML = '<img src="node_modules/feather-icons/dist/icons/grid.svg" alt="Categories" class="icon">';
    categoriesButton.setAttribute('data-tooltip', 'Play Categories');
    categoriesButton.addEventListener('click', () => playGame(game.id));
    
    // Multiple choice mode
    const multipleChoiceButton = document.createElement('div');
    multipleChoiceButton.classList.add('play-option');
    multipleChoiceButton.innerHTML = '<img src="node_modules/feather-icons/dist/icons/list.svg" alt="Multiple Choice" class="icon">';
    multipleChoiceButton.setAttribute('data-tooltip', 'Play Multiple Choice');
    multipleChoiceButton.addEventListener('click', () => playMultipleChoiceGame(game.id));
    
    // Assemble play button
    playOptions.appendChild(categoriesButton);
    playOptions.appendChild(multipleChoiceButton);
    playButton.appendChild(playIcon);
    playButton.appendChild(playOptions);
    
    // Other action buttons
    const editButton = document.createElement('button');
    editButton.innerHTML = '<img src="node_modules/feather-icons/dist/icons/edit.svg" alt="Edit" class="icon">';
    editButton.addEventListener('click', () => editGame(game.id));
    
    const duplicateButton = document.createElement('button');
    duplicateButton.innerHTML = '<img src="node_modules/feather-icons/dist/icons/copy.svg" alt="Duplicate" class="icon">';
    duplicateButton.addEventListener('click', () => duplicateGame(game.id));
    
    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '<img src="node_modules/feather-icons/dist/icons/trash-2.svg" alt="Delete" class="icon">';
    deleteButton.addEventListener('click', () => deleteGame(game.id));
    
    // Assemble card
    buttonContainer.appendChild(playButton);
    buttonContainer.appendChild(editButton);
    buttonContainer.appendChild(duplicateButton);
    buttonContainer.appendChild(deleteButton);
    
    card.appendChild(title);
    card.appendChild(buttonContainer);
    
    return card;
}

/**
 * Duplicates a game
 * @param {string} gameId - ID of game to duplicate
 */
export function duplicateGame(gameId) {
    const savedGames = JSON.parse(localStorage.getItem(CONSTANTS.LOCAL_STORAGE_KEY) || '[]');
    const gameToDuplicate = savedGames.find(g => g.id === gameId);
    
    if (gameToDuplicate) {
        // Find existing copies to determine next number
        const baseTitle = gameToDuplicate.title.replace(/ - \d+$/, '');
        const copies = savedGames.filter(g => 
            g.title.startsWith(baseTitle) && 
            (g.title === baseTitle || g.title.match(/ - \d+$/))
        );
        
        // Get the next available number
        const numbers = copies.map(g => {
            if (g.title === baseTitle) return 0;
            const match = g.title.match(/ - (\d+)$/);
            return match ? parseInt(match[1]) : 0;
        });
        
        const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
        
        const duplicatedGame = {
            ...gameToDuplicate,
            id: Date.now().toString(),
            title: `${baseTitle} - ${nextNumber}`
        };
        
        savedGames.push(duplicatedGame);
        localStorage.setItem(CONSTANTS.LOCAL_STORAGE_KEY, JSON.stringify(savedGames));
        loadGamesLibrary();
    }
}

/**
 * Edits a game
 * @param {string} gameId - ID of game to edit
 */
export function editGame(gameId) {
    const savedGames = JSON.parse(localStorage.getItem(CONSTANTS.LOCAL_STORAGE_KEY) || '[]');
    const game = savedGames.find(g => g.id === gameId);
    
    if (game) {
        setCurrentEditingGameId(gameId);
        showGameCreationScreen();
        
        document.getElementById('game-title').value = game.title;
        document.getElementById('categories').innerHTML = '';
        clearCategories();
        
        game.categories.forEach(category => {
            addCategory(category.title);
            category.answers.forEach(answer => {
                addAnswerToCategory(category.title, answer);
            });
        });
        hasUnsavedChanges = false;
    }
}

export function getHasUnsavedChanges() {
    return hasUnsavedChanges;
}

export function setHasUnsavedChanges(value) {
    hasUnsavedChanges = value;
}

// Initialize listeners when module loads
initializeLibraryListeners();
