/**
 * Countdown Timer Component
 * Shared across product list pages (watchlist, product list, etc.)
 * Updates all elements with class '.countdown-timer' every second.
 */
function updateCountdowns() {
    const countdownElements = document.querySelectorAll('.countdown-timer');

    countdownElements.forEach(element => {
        const endDate = new Date(element.getAttribute('data-end-date'));
        const now = new Date();
        const timeLeft = endDate - now;

        if (timeLeft <= 0) {
            element.textContent = 'Ended';
            element.classList.remove('text-danger');
            element.classList.add('text-muted');
            return;
        }

        // Calculate time units
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        // Format output
        let timeString = '';
        if (days > 0) {
            timeString = `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            timeString = `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            timeString = `${minutes}m ${seconds}s`;
        } else {
            timeString = `${seconds}s`;
        }

        element.textContent = timeString;

        // Change color based on urgency
        if (days === 0 && hours < 1) {
            element.classList.remove('text-danger');
            element.classList.add('text-danger', 'fw-bold');
        }
    });
}

// Update immediately and then every second
document.addEventListener('DOMContentLoaded', function () {
    updateCountdowns();
    setInterval(updateCountdowns, 1000);
});
