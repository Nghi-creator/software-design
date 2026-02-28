/**
 * Product Detail Page - Smart Countdown Logic
 * Specialized for detail page with urgency indicators and redirect.
 */

let countdownEnded = false;

function initSmartCountdown() {
    updateSmartCountdown();
    setInterval(updateSmartCountdown, 1000);
}

function updateSmartCountdown() {
    const countdownElement = document.querySelector('.countdown-timer');
    if (!countdownElement) return;

    const endDate = new Date(countdownElement.getAttribute('data-end-date'));
    const now = new Date();
    const timeLeft = endDate - now;

    if (timeLeft <= 0) {
        countdownElement.textContent = 'Auction Ended';
        countdownElement.classList.remove('text-danger');
        countdownElement.classList.add('text-muted');

        if (!countdownEnded) {
            countdownEnded = true;
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
        return;
    }

    const THREE_DAYS_IN_MS = 3 * 24 * 60 * 60 * 1000;

    if (timeLeft > THREE_DAYS_IN_MS) {
        const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };

        const dateStr = endDate.toLocaleDateString('en-US', dateOptions);
        const timeStr = endDate.toLocaleTimeString('en-US', timeOptions);

        countdownElement.innerHTML = `${dateStr}<br>${timeStr}`;
        countdownElement.classList.remove('text-danger');
        countdownElement.classList.add('text-primary');

        updateLabel(countdownElement, 'Ends at');
    } else {
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        let timeString = days > 0
            ? `${days}d ${hours}h ${minutes}m ${seconds}s`
            : hours > 0
                ? `${hours}h ${minutes}m ${seconds}s`
                : minutes > 0
                    ? `${minutes}m ${seconds}s`
                    : `${seconds}s`;

        countdownElement.textContent = timeString;
        countdownElement.classList.remove('text-primary');
        countdownElement.classList.add('text-danger');

        updateLabel(countdownElement, 'Time Left');

        if (days === 0 && hours < 1) {
            countdownElement.classList.add('fw-bold');
        }
    }
}

function updateLabel(el, text) {
    const infoBox = el.closest('.info-box');
    if (infoBox) {
        const label = infoBox.querySelector('small.text-muted');
        if (label) label.textContent = text;
    }
}

// Export
window.initSmartCountdown = initSmartCountdown;
