/**
 * Product Detail Page - Bidding Logic
 */

let bidConfig = {
    currentPrice: 0,
    minIncrement: 0,
    productId: 0,
    isAuthenticated: false
};

let pressTimer = null;
let isLongPress = false;
let repeatInterval = null;

/**
 * Initialize Bidding Logic
 * @param {Object} config - { currentPrice, minIncrement, productId, isAuthenticated }
 */
function initBidding(config) {
    bidConfig = { ...bidConfig, ...config };

    // Format bid input on user input
    const bidAmountInput = document.getElementById('bidAmount');
    if (bidAmountInput) {
        bidAmountInput.addEventListener('input', function (e) {
            handleBidAmountInput(this);
        });
    }

    // Bid Button
    const placeBidBtn = document.querySelector('.btn-place-bid');
    if (placeBidBtn) {
        placeBidBtn.addEventListener('click', handlePlaceBidClick);
    }

    // Modal Events
    const bidModalEl = document.getElementById('bidModal');
    if (bidModalEl) {
        bidModalEl.addEventListener('hidden.bs.modal', resetBidModal);
    }

    // Confirmation Checkbox
    const confirmBidCheckbox = document.getElementById('confirmBidCheckbox');
    const submitBidBtn = document.getElementById('submitBidBtn');
    if (confirmBidCheckbox && submitBidBtn) {
        confirmBidCheckbox.addEventListener('change', function () {
            submitBidBtn.disabled = !this.checked;
            submitBidBtn.style.opacity = this.checked ? '1' : '0.6';
        });
    }

    // Form Submission
    const bidForm = document.getElementById('bidForm');
    if (bidForm) {
        bidForm.addEventListener('submit', handleBidFormSubmit);
    }

    // Buy Now Button
    const buyNowBtn = document.querySelector('.btn-buy-now');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', handleBuyNow);
    }

    // Control Buttons
    initBidControls();
}

function handlePlaceBidClick() {
    if (!bidConfig.isAuthenticated) {
        window.location.href = `/account/signin?retUrl=/products/detail?id=${bidConfig.productId}`;
        return;
    }

    const suggestedBid = bidConfig.currentPrice + bidConfig.minIncrement;
    const bidInput = document.getElementById('bidAmount');
    if (bidInput) {
        bidInput.value = formatNumberWithCommas(suggestedBid);
        bidInput.setAttribute('data-raw-value', suggestedBid);
    }

    // Use window.bootstrap if available
    const bidModal = new bootstrap.Modal(document.getElementById('bidModal'));
    bidModal.show();
}

function resetBidModal() {
    const checkbox = document.getElementById('confirmBidCheckbox');
    const submitBtn = document.getElementById('submitBidBtn');
    if (checkbox) checkbox.checked = false;
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
    }
}

function handleBidAmountInput(input) {
    let value = removeCommas(input.value);
    value = value.replace(/[^\d]/g, '');

    if (value === '') {
        input.value = '';
        input.setAttribute('data-raw-value', '0');
        return;
    }

    const numValue = parseInt(value);
    input.setAttribute('data-raw-value', numValue);
    input.value = formatNumberWithCommas(numValue);

    const minBid = bidConfig.currentPrice + bidConfig.minIncrement;
    if (numValue && numValue < minBid) {
        input.setCustomValidity('Giá đấu phải ít nhất ' + formatNumberWithCommas(minBid) + ' VND');
    } else {
        input.setCustomValidity('');
    }
}

function handleBidFormSubmit(e) {
    const bidInput = document.getElementById('bidAmount');
    const rawValue = bidInput.getAttribute('data-raw-value');
    const hiddenInput = document.getElementById('bidAmountRaw');

    if (hiddenInput) {
        hiddenInput.value = rawValue || removeCommas(bidInput.value);
    }

    const submitBtn = document.getElementById('submitBidBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('processing');
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
    }
}

// Utility functions
function formatNumberWithCommas(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function removeCommas(str) {
    return str.replace(/,/g, '');
}

// Bid Adjustment Logic
function adjustBid(amount) {
    const bidInput = document.getElementById('bidAmount');
    if (!bidInput) return;

    let currentBid = parseInt(bidInput.getAttribute('data-raw-value')) || (bidConfig.currentPrice + bidConfig.minIncrement);
    const minBid = bidConfig.currentPrice + bidConfig.minIncrement;
    const newBid = Math.max(minBid, currentBid + amount);

    bidInput.setAttribute('data-raw-value', newBid);
    bidInput.value = formatNumberWithCommas(newBid);
    bidInput.setCustomValidity('');
}

function initBidControls() {
    const increaseBtn = document.getElementById('increaseBid');
    const decreaseBtn = document.getElementById('decreaseBid');

    if (increaseBtn) {
        increaseBtn.addEventListener('mousedown', () => startPress(1));
        increaseBtn.addEventListener('mouseup', () => stopPress(1));
        increaseBtn.addEventListener('mouseleave', stopPress);
        increaseBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startPress(1); });
        increaseBtn.addEventListener('touchend', (e) => { e.preventDefault(); stopPress(1); });
    }

    if (decreaseBtn) {
        decreaseBtn.addEventListener('mousedown', () => startPress(-1));
        decreaseBtn.addEventListener('mouseup', () => stopPress(-1));
        decreaseBtn.addEventListener('mouseleave', stopPress);
        decreaseBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startPress(-1); });
        decreaseBtn.addEventListener('touchend', (e) => { e.preventDefault(); stopPress(-1); });
    }

    // Quick increment/decrement
    document.querySelectorAll('.quick-increment').forEach(btn => {
        btn.addEventListener('click', function () {
            const multiplier = parseInt(this.getAttribute('data-multiplier'));
            adjustBid(bidConfig.minIncrement * multiplier);
        });
    });

    document.querySelectorAll('.quick-decrement').forEach(btn => {
        btn.addEventListener('click', function () {
            const multiplier = parseInt(this.getAttribute('data-multiplier'));
            adjustBid(-bidConfig.minIncrement * multiplier);
        });
    });
}

function startPress(direction) {
    isLongPress = false;
    pressTimer = setTimeout(() => {
        isLongPress = true;
        repeatAdjustment(direction);
    }, 500);
}

function stopPress(direction) {
    clearTimeout(pressTimer);
    clearInterval(repeatInterval);
    if (!isLongPress && direction) {
        adjustBid(direction * bidConfig.minIncrement);
    }
}

function repeatAdjustment(direction) {
    adjustBid(direction * bidConfig.minIncrement);
    repeatInterval = setInterval(() => {
        adjustBid(direction * bidConfig.minIncrement);
    }, 100);
}

// Export
window.initBidding = initBidding;
window.adjustBid = adjustBid;
