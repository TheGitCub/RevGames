import { getCurrentEditingGameId, setCurrentEditingGameId, setUnsavedChanges } from './gameStateManager.js';
import { navigateToHome } from './screenManager.js';

export function saveGame() {
    const gameTitle = document.getElementById('game-title').value;
    let gameData = {
        id: getCurrentEditingGameId() || Date.now().toString(),
        title: gameTitle,
        categories: []
    };

    document.querySelectorAll(".category").forEach(categoryDiv => {
        let categoryTitle = categoryDiv.id;
        let answers = [];

        categoryDiv.querySelectorAll(".answers-list .answer").forEach(answerDiv => {
            let answerText = answerDiv.querySelector("span").textContent;
            answers.push(answerText);
        });

        gameData.categories.push({
            title: categoryTitle,
            answers: answers
        });
    });

    const savedGames = JSON.parse(localStorage.getItem('categoryGames') || '[]');
    
    if (getCurrentEditingGameId()) {
        // Update existing game
        const gameIndex = savedGames.findIndex(g => g.id === getCurrentEditingGameId());
        if (gameIndex !== -1) {
            savedGames[gameIndex] = gameData;
        }
        setCurrentEditingGameId(null); // Reset the editing ID
    } else {
        // Add new game
        savedGames.push(gameData);
    }
    
    localStorage.setItem('categoryGames', JSON.stringify(savedGames));
    setUnsavedChanges(false);
    navigateToHome();
}


export function loadGame(event) {
    let file = event.target.files[0];

    // Check if the selected file is a valid JSON file
    if (file && file.type === "application/json") {
        let reader = new FileReader();
        
        reader.onload = function(e) {
            let gameData = JSON.parse(e.target.result);  // Parse the loaded JSON data

            // Clear current categories before loading new ones
            document.getElementById("categories").innerHTML = "";
            categories = [];  // Reset categories array

            // Loop through the loaded categories and recreate them
            gameData.categories.forEach(category => {
                if (category.title && Array.isArray(category.answers)) {
                    addCategory(category.title);  // Add category
                    category.answers.forEach(answer => {
                        if (answer) {
                            addAnswerToCategory(category.title, answer);
                        }
                    });
                }
            });
        };

        // Read the file as text (JSON)
        reader.readAsText(file);
    } else {
        alert("Please upload a valid JSON file.");  // Alert if file is not valid
    }
}