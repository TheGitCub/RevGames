const THEME_CONSTANTS = {
    STORAGE_KEY: 'theme',
    DARK_MODE_CLASS: 'dark-mode',
    ICONS: {
        LIGHT: 'node_modules/feather-icons/dist/icons/moon.svg',
        DARK: 'node_modules/feather-icons/dist/icons/sun.svg'
    },
    DEFAULT_THEME: 'dark'
};

/**
 * Custom event fired when theme changes
 * @type {CustomEvent}
 */
export const themeChangeEvent = new CustomEvent('themeChange', {
    bubbles: true,
    detail: { theme: THEME_CONSTANTS.DEFAULT_THEME }
});

/**
 * Initializes the theme toggle functionality
 * @returns {Function} Cleanup function to remove event listeners
 * @throws {Error} If required DOM elements are not found
 */
export function initializeTheme() {
    const themeToggleButton = document.getElementById('theme-toggle');
    if (!themeToggleButton) {
        throw new Error('Theme toggle button not found');
    }

    const themeToggleIcon = themeToggleButton.querySelector('img');
    if (!themeToggleIcon) {
        throw new Error('Theme toggle icon not found');
    }

    // Initialize theme from localStorage or default
    const savedTheme = localStorage.getItem(THEME_CONSTANTS.STORAGE_KEY) || THEME_CONSTANTS.DEFAULT_THEME;
    updateTheme(savedTheme === 'dark', themeToggleIcon);

    // Theme toggle handler
    const handleThemeToggle = () => {
        const isDarkMode = document.body.classList.toggle(THEME_CONSTANTS.DARK_MODE_CLASS);
        updateTheme(isDarkMode, themeToggleIcon);
        
        // Dispatch theme change event
        themeChangeEvent.detail.theme = isDarkMode ? 'dark' : 'light';
        document.dispatchEvent(themeChangeEvent);
    };

    themeToggleButton.addEventListener('click', handleThemeToggle);

    // Return cleanup function
    return () => {
        themeToggleButton.removeEventListener('click', handleThemeToggle);
    };
}

/**
 * Updates theme-related UI elements
 * @param {boolean} isDarkMode - Whether dark mode is enabled
 * @param {HTMLImageElement} iconElement - The theme toggle icon element
 */
function updateTheme(isDarkMode, iconElement) {
    if (isDarkMode) {
        document.body.classList.add(THEME_CONSTANTS.DARK_MODE_CLASS);
        iconElement.src = THEME_CONSTANTS.ICONS.DARK;
    } else {
        document.body.classList.remove(THEME_CONSTANTS.DARK_MODE_CLASS);
        iconElement.src = THEME_CONSTANTS.ICONS.LIGHT;
    }
    localStorage.setItem(THEME_CONSTANTS.STORAGE_KEY, isDarkMode ? 'dark' : 'light');
}