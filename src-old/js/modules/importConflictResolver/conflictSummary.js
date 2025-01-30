// Import functions from conflictRenameOptions.js
import { 
  handleRenameResolution 
} from './conflictRenameOptions.js';

// Import functions from importConflictResolver.js
import { 
  handleOverwriteResolution, 
} from './importConflictResolver.js';

/**
 * Updates the conflict resolution summary
 */
function updateConflictSummary() {
    const summary = document.querySelector('.conflict-summary');
    if (!summary) return;
    
    const total = conflictGroups.length;
    const resolved = currentResolutions.size;
    
    summary.textContent = `Resolved ${resolved} of ${total} conflicts`;
    
    // Enable/disable apply button
    const applyButton = document.getElementById('apply-changes');
    if (applyButton) {
        applyButton.disabled = resolved < total;
    }
}

/**
 * Checks if there are unresolved conflicts
 * @returns {boolean} True if there are unresolved conflicts
 */
function hasUnresolvedConflicts() {
    return currentResolutions.size < conflictGroups.length;
}

/**
 * Applies all conflict resolutions
 * @returns {Promise<void>}
 */
async function applyResolutions() {
    const results = {
        skipped: 0,
        renamed: 0,
        overwritten: 0
    };
    
    try {
        for (const [index, resolution] of currentResolutions.entries()) {
            const conflict = conflictGroups[index];
            
            switch (resolution.action) {
                case 'skip':
                    results.skipped++;
                    break;
                    
                case 'rename':
                    await handleRenameResolution(conflict, resolution);
                    results.renamed++;
                    break;
                    
                case 'overwrite':
                    await handleOverwriteResolution(conflict, resolution);
                    results.overwritten++;
                    break;
            }
        }
        
        showPopupModal('Import Summary', `
            Categories processed:
              - Skipped: ${results.skipped}
              - Renamed: ${results.renamed}
              - Overwritten: ${results.overwritten}
        `, { autoClose: true });
        
        closeConflictModal();
    } catch (error) {
        console.error('Error applying resolutions:', error);
        showPopupModal('Error', 'Failed to apply some changes. Please try again.');
    }
}

// Export each function individually
export { updateConflictSummary, hasUnresolvedConflicts, applyResolutions };
