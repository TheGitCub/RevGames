/**
 * Timer state and configuration
 * @type {Object}
 */
const TIMER_STATE = {
    INTERVAL_MS: 1000,
    timer: null,
    seconds: 0,
    isRunning: false
};

/**
 * Custom event fired when timer updates
 * @type {CustomEvent}
 */
export const timerUpdateEvent = new CustomEvent('timerUpdate', {
    bubbles: true,
    detail: { seconds: 0 }
});

/**
 * Starts or restarts the timer
 * @throws {Error} If timer element is not found
 */
export function startTimer() {
    const timerElement = document.getElementById('timer');
    if (!timerElement) {
        throw new Error('Timer element not found');
    }

    // Clear existing timer if running
    if (TIMER_STATE.isRunning) {
        stopTimer();
    }

    // Reset and start
    TIMER_STATE.seconds = 0;
    TIMER_STATE.isRunning = true;
    updateTimerDisplay();
    
    TIMER_STATE.timer = setInterval(() => {
        TIMER_STATE.seconds++;
        updateTimerDisplay();
        
        // Dispatch timer update event
        timerUpdateEvent.detail.seconds = TIMER_STATE.seconds;
        document.dispatchEvent(timerUpdateEvent);
    }, TIMER_STATE.INTERVAL_MS);
}

/**
 * Stops the timer and resets the display
 */
export function stopTimer() {
    if (TIMER_STATE.timer) {
        clearInterval(TIMER_STATE.timer);
        TIMER_STATE.timer = null;
    }
    TIMER_STATE.isRunning = false;
    TIMER_STATE.seconds = 0;
    updateTimerDisplay();
}

/**
 * Pauses the timer without resetting
 */
export function pauseTimer() {
    if (TIMER_STATE.timer) {
        clearInterval(TIMER_STATE.timer);
        TIMER_STATE.timer = null;
    }
    TIMER_STATE.isRunning = false;
}

/**
 * Updates the timer display
 * @private
 */
function updateTimerDisplay() {
    const timerElement = document.getElementById('timer');
    if (!timerElement) return;

    const minutes = Math.floor(TIMER_STATE.seconds / 60);
    const remainingSeconds = TIMER_STATE.seconds % 60;
    timerElement.textContent = 
        `Time: ${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Gets the current timer value in seconds
 * @returns {number} Current seconds
 */
export function getSeconds() {
    return TIMER_STATE.seconds;
}

/**
 * Checks if the timer is currently running
 * @returns {boolean} Timer running status
 */
export function isTimerRunning() {
    return TIMER_STATE.isRunning;
}