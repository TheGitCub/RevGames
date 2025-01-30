import { setUnsavedChanges, getCategories, addCategory as addCategoryToState, removeCategory } from './gameStateManager.js';
import { drop, drag, dragEnd, allowDrop } from './dragAndDrop.js';

export function addCategory(existingTitle, existingAnswers) {
    const categoryInput = document.getElementById("category-input");
    let categoryTitle = existingTitle || (categoryInput ? categoryInput.value.trim() : '');
    let answers = existingAnswers || [];

    if (categoryTitle && !getCategories().includes(categoryTitle)) {
        let categoryDiv = document.createElement("div");
        categoryDiv.classList.add("category");
        categoryDiv.id = categoryTitle;
        categoryDiv.ondrop = drop;
        categoryDiv.ondragover = allowDrop;

        // Header section
        let categoryTitleElement = document.createElement("h3");
        categoryTitleElement.textContent = categoryTitle;

        // Answers list
        let answersListDiv = document.createElement("div");
        answersListDiv.classList.add("answers-list");

        // Input container
        let inputContainer = document.createElement("div");
        inputContainer.classList.add("input-container");

        let answerInputField = document.createElement("input");
        answerInputField.type = "text";
        answerInputField.placeholder = "Enter an answer";
        answerInputField.onkeydown = function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                addAnswerButton.click();
            }
        };

        let addAnswerButton = document.createElement("button");
        addAnswerButton.innerHTML = `<img src="node_modules/feather-icons/dist/icons/corner-down-left.svg" alt="Add Answer" class="icon">`;
        addAnswerButton.classList.add("icon-button");
        addAnswerButton.title = "Add Answer";
        addAnswerButton.addEventListener("click", () => {
            addAnswerToCategory(categoryTitle, answerInputField.value.trim());
            answerInputField.value = "";
            setUnsavedChanges(true);
        }, false);

        inputContainer.appendChild(answerInputField);
        inputContainer.appendChild(addAnswerButton);

        // Category action buttons container
        let categoryactionbuttonsContainer = document.createElement("div");
        categoryactionbuttonsContainer.classList.add("delete-container");

        let deleteCategoryButton = document.createElement("button");
        deleteCategoryButton.innerHTML = `
            <img src="node_modules/feather-icons/dist/icons/trash-2.svg" alt="Delete Category" class="icon">
        `;
        deleteCategoryButton.classList.add("delete-category-btn", "icon-button");
        deleteCategoryButton.title = "Delete Category";
        deleteCategoryButton.onclick = function() {
            categoryDiv.remove();
            removeCategory(categoryTitle);
            setUnsavedChanges(true);
        };

        let duplicateCategoryButton = document.createElement("button");
        duplicateCategoryButton.innerHTML = `
            <img src="node_modules/feather-icons/dist/icons/copy.svg" alt="Duplicate Category" class="icon">
        `;
        duplicateCategoryButton.classList.add("duplicate-category-btn", "icon-button");
        duplicateCategoryButton.title = "Duplicate Category";
        duplicateCategoryButton.addEventListener("click", () => {
            addCategory(categoryTitle, answers);
            setUnsavedChanges(true);
        });

        categoryactionbuttonsContainer.appendChild(deleteCategoryButton);
        categoryactionbuttonsContainer.appendChild(duplicateCategoryButton);

        // Build the category structure
        let categoryContentDiv = document.createElement("div");
        categoryContentDiv.classList.add("category-content");
        categoryContentDiv.ondrop = drop;
        categoryContentDiv.ondragover = allowDrop;

        categoryContentDiv.appendChild(categoryTitleElement);
        categoryContentDiv.appendChild(answersListDiv);
        categoryContentDiv.appendChild(inputContainer);
        categoryContentDiv.appendChild(categoryactionbuttonsContainer);

        categoryDiv.appendChild(categoryContentDiv);
        document.getElementById("categories").appendChild(categoryDiv);
        addCategoryToState(categoryTitle);

        // Add answers to the duplicated category
        if (Array.isArray(existingAnswers)) {
            existingAnswers.forEach(answer => {
                const answerText = typeof answer === 'string' ? answer : answer.text;
                const answerId = typeof answer === 'string' ? null : answer.id;
                addAnswerToCategory(categoryTitle, answerText, answerId);
            });
        }

        if (!existingTitle && categoryInput) {
            categoryInput.value = '';  // Clear input after successful addition
            setUnsavedChanges(true);
        }
    } else if (!existingTitle) {
        alert("Please enter a valid category name.");
    }
}

export function addAnswerToCategory(categoryTitle, answerText, answerId = null) {
    if (answerText) {
        let categoryDiv = document.getElementById(categoryTitle);
        let answersListDiv = categoryDiv.querySelector(".answers-list");

        let answerDiv = document.createElement("div");
        answerDiv.classList.add("answer");
        answerDiv.setAttribute("draggable", "true");
        answerDiv.id = answerId || "answer-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
        answerDiv.ondragstart = drag;
        answerDiv.ondragend = dragEnd;

        let answerContent = document.createElement("span");
        answerContent.textContent = answerText;

        let buttonContainer = document.createElement("div");
        buttonContainer.classList.add("answer-buttons");

        let duplicateAnswerButton = document.createElement("button");
        duplicateAnswerButton.innerHTML = `
            <img src="node_modules/feather-icons/dist/icons/copy.svg" alt="Duplicate Answer" class="icon">
        `;
        duplicateAnswerButton.classList.add("duplicate-answer-btn", "icon-button");
        duplicateAnswerButton.title = "Duplicate Answer";
        duplicateAnswerButton.onclick = function() {
          // Get the current category from the parent elements
          const currentCategory = this.closest('.category').id;
          addAnswerToCategory(currentCategory, answerText);
          setUnsavedChanges(true)
          };

        let deleteButton = document.createElement("button");
        deleteButton.innerHTML = `
            <img src="node_modules/feather-icons/dist/icons/trash-2.svg" alt="Delete Answer" class="icon">
        `;
        deleteButton.classList.add("icon-button");
        deleteButton.title = "Delete Answer";
        deleteButton.onclick = function() {
            deleteAnswer(answerDiv);
            setUnsavedChanges(true)
        };

        buttonContainer.appendChild(duplicateAnswerButton);
        buttonContainer.appendChild(deleteButton);

        answerDiv.appendChild(answerContent);
        answerDiv.appendChild(buttonContainer);

        answersListDiv.appendChild(answerDiv);
    } else {
        alert("Please enter a valid answer.");
    }
}

export function handleCategoryEnter(event) {
    if (event.key === 'Enter') {
        event.preventDefault();  // Prevent form submission or any default action
        document.getElementById('add-category-button').click();
    }
}

export function handleCategoryDelete(target) {
    const categoryTitle = target.closest('.category').id;
    target.closest('.category').remove();
    removeCategory(categoryTitle);
    setUnsavedChanges(true);
}

export function handleDuplicateCategory(target) {
    // Get the original category element and title
    const originalCategoryDiv = target.closest('.category');
    const originalCategoryTitle = originalCategoryDiv.id;

    // Base title: Strip off existing ` - N` suffix if it exists
    const baseTitle = originalCategoryTitle.replace(/\s-\s\d+$/, '');

    // Generate a unique title by appending ` - N`
    let copyNumber = 1;
    let newCategoryTitle = `${baseTitle} - ${copyNumber}`;

    // Find the next available number for the duplicate
    const existingCategoryTitles = getCategories(); // Copy the current categories array
    while (existingCategoryTitles.includes(newCategoryTitle)) {
        copyNumber++;
        newCategoryTitle = `${baseTitle} - ${copyNumber}`;
    }

    // Collect answers from the original category
    const originalAnswers = Array.from(originalCategoryDiv.querySelectorAll('.answer')).map(answer => {
        return {
            text: answer.querySelector('span').textContent,
            id: answer.id
        };
    });

    // Prepare duplicated answers with unique IDs
    const duplicatedAnswers = originalAnswers.map(answer => {
        return {
            text: answer.text,
            id: `answer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
    });

    // Use the `addCategory` function to create the duplicated category
    addCategory(newCategoryTitle, duplicatedAnswers.map(answer => answer.text));

    // Update the IDs of the duplicated answers
    const newCategoryDiv = document.getElementById(newCategoryTitle);
    duplicatedAnswers.forEach((answer, index) => {
        const answerDiv = newCategoryDiv.querySelectorAll('.answer')[index];
        answerDiv.id = answer.id; // Assign the new unique ID
    });

    // Add the new category title to the list of categories
    addCategoryToState(newCategoryTitle);

    setUnsavedChanges(true);
}

// Function to delete an answer from the category
export function deleteAnswer(answerDiv) {
    answerDiv.parentElement.removeChild(answerDiv);
}