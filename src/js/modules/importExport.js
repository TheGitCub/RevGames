// Import necessary dependencies
import { showPopupModal } from './uiManager.js';
import { addCategory } from './categoryManagement.js';
import { showConflictModal } from './importConflictResolver/conflictModal.js';

// State variables
let importedCategoriesList = []; // To track the categories already added
let importDataList = []; // To store the preview data before confirming import
let conflictCategories = []; // To store categories with conflicts

export function initializeImportExport() {
    // Event listener for 'import-button' click to trigger file input click
    document.getElementById('import-button').addEventListener('click', () => {
        const importFileInput = document.getElementById('import-file-input');
        importFileInput.value = ''; // Reset the file input
        importFileInput.click(); // Trigger file input dialog
    });

    // Event listener for file input change
    document.getElementById('import-file-input').addEventListener('change', handleFileSelect);

    // Event listener for confirming the import
    document.getElementById('confirm-import-button').addEventListener('click', handleImportConfirm);
}

export function handleFileSelect(event) {
    const file = event.target.files[0];

    if (file?.type === "text/csv") {
        const reader = new FileReader();
        reader.onload = handleFileRead;
        reader.readAsText(file);
    } else {
        showPopupModal("Error", "Please upload a valid CSV file.");
    }
}

export function handleFileRead(e) {
    const lines = e.target.result.split('\n').filter(line => line.trim());
    importDataList = []; // Clear previous data
    setupPreviewTable(lines);
    document.getElementById('import-preview-modal').style.display = 'block';
}

export function setupPreviewTable(lines) {
    const tbody = document.getElementById('import-preview-table').querySelector('tbody');
    const thead = document.getElementById('import-preview-table').querySelector('thead');
    
    // Reset table
    tbody.innerHTML = '';
    thead.innerHTML = '';

    // Setup headers
    setupTableHeaders(thead);

    // Parse and display CSV data
    lines.forEach((line, index) => {
        const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(value => 
            value.replace(/(^"|"$)/g, '').trim()
        );

        if (values?.length >= 2) {
            addRowToPreviewTable(tbody, values, index);
        }
    });
}

export function setupTableHeaders(thead) {
    const headerRow = thead.insertRow();
    const selectAllCell = headerRow.insertCell();
    selectAllCell.innerHTML = '<input type="checkbox" id="select-all-checkbox">';
    headerRow.insertCell().innerText = 'Category';
    headerRow.insertCell().innerText = 'Answers';

    // Add select-all functionality
    document.getElementById('select-all-checkbox').addEventListener('change', (event) => {
        const isChecked = event.target.checked;
        document.querySelectorAll('.category-checkbox').forEach(checkbox => 
            checkbox.checked = isChecked
        );
    });
}

export function addRowToPreviewTable(tbody, values, index) {
    const [category, ...answers] = values;
    const filteredCategory = category.trim();
    const filteredAnswers = answers.filter(answer => answer.trim()).map(answer => answer.trim());

    if (filteredCategory && filteredAnswers.length > 0) {
        importDataList.push({ category: filteredCategory, answers: filteredAnswers });
        
        const row = tbody.insertRow();
        row.insertCell().innerHTML = `<input type="checkbox" class="category-checkbox" data-index="${importDataList.length - 1}">`;
        row.insertCell().innerText = filteredCategory;
        
        filteredAnswers.forEach(answer => {
            const cell = row.insertCell();
            cell.innerText = answer;
        });

        // Add context menu functionality
        row.addEventListener('contextmenu', (event) => {
            handleContextMenu(event, row, filteredCategory, filteredAnswers);
        });
    }
}

export function handleContextMenu(event, row, category, answers) {
    event.preventDefault();
    
    // Remove existing context menu if any
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
        document.body.removeChild(existingMenu);
    }

    // Create and display new context menu
    const menu = createContextMenu(category, answers);
    document.body.appendChild(menu);

    // Position the menu
    menu.style.position = 'absolute';
    menu.style.top = `${event.clientY}px`;
    menu.style.left = `${event.clientX}px`;

    // Add close handlers
    addContextMenuCloseHandlers(menu);
}

export function createContextMenu(category, answers) {
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `<button class="set-header">Set as Header</button>`;

    menu.querySelector('.set-header').addEventListener('click', () => {
        updateDataWithHeader(category, answers);
        document.body.removeChild(menu);
    });

    return menu;
}

export function updateDataWithHeader(category, answers) {
    // Update data with the selected header
    importDataList = importDataList.map(item => ({
        category: `${category} - ${item.category}`,
        answers: item.answers.map((answer, i) => 
            `${answers[i] || ''} - ${answer}`
        )
    }));

    refreshPreviewTable();
}

export function refreshPreviewTable() {
    const tbody = document.getElementById('import-preview-table').querySelector('tbody');
    const thead = document.getElementById('import-preview-table').querySelector('thead');

    tbody.innerHTML = '';
    thead.innerHTML = '';

    setupTableHeaders(thead);

    importDataList.forEach((item, index) => {
        const row = tbody.insertRow();
        row.insertCell().innerHTML = `<input type="checkbox" class="category-checkbox" data-index="${index}">`;
        row.insertCell().innerText = item.category;
        item.answers.forEach(answer => {
            row.insertCell().innerText = answer;
        });
    });
}

export async function handleImportConfirm() {
    const confirmButton = document.getElementById('confirm-import-button');
    const selectedCategories = [];

    document.querySelectorAll('.category-checkbox:checked').forEach(checkbox => {
        const index = parseInt(checkbox.dataset.index, 10);
        if (!isNaN(index) && importDataList[index]) {
            selectedCategories.push(importDataList[index]);
        }
    });

    if (selectedCategories.length === 0) {
        if (confirmButton.disabled) return;
        
        confirmButton.disabled = true;
        confirmButton.classList.add('no-categories');
        
        setTimeout(() => {
            confirmButton.disabled = false;
            confirmButton.classList.remove('no-categories');
        }, 1000);
        
        return;
    }

    try {
        // Check for conflicts
        const conflicts = findConflicts(selectedCategories);
        
        if (conflicts.length > 0) {
            // Hide import preview modal
            document.getElementById('import-preview-modal').style.display = 'none';
            // Show conflict resolution modal
            showConflictModal(conflicts);
        } else {
            // No conflicts, proceed with normal import
            for (const category of selectedCategories) {
                await addCategory(category.category, category.answers);
            }
            document.getElementById('import-preview-modal').style.display = 'none';
        }
    } catch (error) {
        showPopupModal("Error", `Error during import: ${error.message}`);
    }
}

/**
 * Finds conflicts between selected categories and existing ones
 * @param {Array<{category: string, answers: string[]}>} selectedCategories
 * @returns {Array<{existing: Object, newCategories: Array}>}
 */
function findConflicts(selectedCategories) {
    const conflicts = [];
    const conflictMap = new Map();

    // Group categories by name
    selectedCategories.forEach(category => {
        const existingElement = document.getElementById(category.category);
        
        if (existingElement) {
            // Get existing category data
            const existingAnswers = Array.from(
                existingElement.querySelectorAll('.answer span')
            ).map(span => span.textContent);

            const conflictGroup = conflictMap.get(category.category) || {
                existing: {
                    category: category.category,
                    answers: existingAnswers
                },
                newCategories: []
            };

            // Add new category to conflict group
            conflictGroup.newCategories.push({
                category: category.category,
                answers: category.answers,
                source: 'Import'
            });

            conflictMap.set(category.category, conflictGroup);
        }
    });

    // Convert map to array
    conflictMap.forEach(group => conflicts.push(group));

    return conflicts;
}

export function addContextMenuCloseHandlers(menu) {
    document.body.addEventListener('click', () => {
        if (menu && menu.parentNode === document.body) {
            document.body.removeChild(menu);
        }
    });

    menu.addEventListener('mouseleave', () => {
        document.body.removeChild(menu);
    });
}

