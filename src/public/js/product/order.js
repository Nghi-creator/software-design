/**
 * Order Status Actions Module
 * Handles core transitions: confirm payment, confirm delivery, and rating.
 */

// Global orderId for the module
let currentOrderId = null;

/**
 * Initialize core order actions
 * @param {string} orderId - The current order ID
 */
function initOrderActions(orderId) {
    currentOrderId = orderId;
}

/**
 * Confirm payment received (Seller action)
 */
async function confirmPayment() {
    if (!currentOrderId) return;

    const result = await Swal.fire({
        title: 'Confirm Payment?',
        text: 'Have you received full payment from the bidder?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Payment Received',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#72AEC8'
    });

    if (!result.isConfirmed) return;

    try {
        const response = await fetch(`/products/order/${currentOrderId}/confirm-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const res = await response.json();

        if (res.success) {
            await Swal.fire({
                icon: 'success',
                title: 'Confirmed!',
                text: 'Payment has been confirmed successfully.',
                timer: 2000,
                showConfirmButton: false
            });
            location.reload();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: res.error || 'Failed to confirm payment receipt.',
                confirmButtonColor: '#72AEC8'
            });
        }
    } catch (error) {
        console.error('Confirm payment error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'An unexpected error occurred: ' + error.message,
            confirmButtonColor: '#72AEC8'
        });
    }
}

/**
 * Confirm delivery received (Buyer action)
 */
async function confirmDelivery() {
    if (!currentOrderId) return;

    const result = await Swal.fire({
        title: 'Confirm Receipt?',
        text: 'Did you receive the item in good condition?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Confirm Receipt',
        cancelButtonText: 'Not Yet',
        confirmButtonColor: '#72AEC8'
    });

    if (!result.isConfirmed) return;

    try {
        const response = await fetch(`/products/order/${currentOrderId}/confirm-delivery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const res = await response.json();

        if (res.success) {
            await Swal.fire({
                icon: 'success',
                title: 'Confirmed!',
                text: 'Receipt confirmed! You can now rate the transaction.',
                timer: 2000,
                showConfirmButton: false
            });
            location.reload();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: res.error || 'Failed to confirm receipt.',
                confirmButtonColor: '#72AEC8'
            });
        }
    } catch (error) {
        console.error('Confirm delivery error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'An unexpected error occurred: ' + error.message,
            confirmButtonColor: '#72AEC8'
        });
    }
}

/**
 * Submit rating for the transaction
 * @param {Object} options - { isBuyer, targetName, sellerFullName, bidderName }
 */
async function submitRating(options) {
    if (!currentOrderId) return;

    const { isBuyer, targetName } = options;

    const { value: formValues } = await Swal.fire({
        title: `Rate ${targetName}`,
        html: `
            <div class="mb-3 text-start">
                <label class="form-label fw-bold">Your Rating:</label>
                <div class="btn-group w-100" role="group">
                    <input type="radio" class="btn-check" name="rating" id="rating-positive" value="positive" autocomplete="off">
                    <label class="btn btn-outline-success py-2" for="rating-positive">
                        <i class="bi bi-hand-thumbs-up"></i> Positive (+1)
                    </label>
                    
                    <input type="radio" class="btn-check" name="rating" id="rating-negative" value="negative" autocomplete="off">
                    <label class="btn btn-outline-danger py-2" for="rating-negative">
                        <i class="bi bi-hand-thumbs-down"></i> Negative (-1)
                    </label>
                </div>
            </div>
            <div class="mb-3 text-start">
                <label class="form-label fw-bold">Comment (optional):</label>
                <textarea class="form-control" id="rating-comment" rows="3" placeholder="Describe your experience with this transaction..."></textarea>
            </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#72AEC8',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Submit Rating',
        cancelButtonText: 'Skip for now',
        preConfirm: () => {
            const rating = document.querySelector('input[name="rating"]:checked');
            const comment = document.getElementById('rating-comment').value;

            if (!rating) {
                Swal.showValidationMessage('Please select a rating (Positive or Negative)');
                return false;
            }

            return {
                rating: rating.value,
                comment: comment,
                completeTransaction: true
            };
        }
    });

    if (formValues) {
        try {
            Swal.fire({
                title: 'Processing...',
                html: 'Submitting your rating...',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            const response = await fetch(`/products/order/${currentOrderId}/submit-rating`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formValues)
            });

            const result = await response.json();

            if (result.success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Thank you!',
                    text: 'Rating submitted successfully! Transaction closed.',
                    timer: 2000,
                    showConfirmButton: false
                });

                // Redirect to respective pages after rating
                window.location.href = isBuyer ? '/account/auctions' : '/seller/products/sold';
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: result.error || 'Failed to submit rating.',
                    confirmButtonColor: '#72AEC8'
                });
            }
        } catch (error) {
            console.error('Submit rating error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: 'An error occurred: ' + error.message,
                confirmButtonColor: '#72AEC8'
            });
        }
    } else if (formValues === undefined) {
        // User clicked "Skip for now" (cancel button)
        await completeTransactionWithoutRating(isBuyer);
    }
}

/**
 * Complete transaction without rating
 * @param {boolean} isBuyer 
 */
async function completeTransactionWithoutRating(isBuyer) {
    try {
        Swal.fire({
            title: 'Completing Transaction...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        const response = await fetch(`/products/order/${currentOrderId}/complete-transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (result.success) {
            window.location.href = isBuyer ? '/account/auctions' : '/seller/products/sold';
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: result.error || 'Failed to complete transaction.',
                confirmButtonColor: '#72AEC8'
            });
        }
    } catch (error) {
        console.error('Complete transaction error:', error);
        // Fallback redirect
        window.location.href = isBuyer ? '/account/auctions' : '/seller/products/sold';
    }
}

/**
 * Image modal functions (Lightbox Lite)
 */
function showImageModal(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    if (modal && modalImg) {
        modalImg.src = imageSrc;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Disable scroll
    }
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Enable scroll
    }
}

// Global exposure for legacy onclick handlers if needed, though we should transition to event listeners
window.confirmPayment = confirmPayment;
window.confirmDelivery = confirmDelivery;
window.submitRating = submitRating;
window.showImageModal = showImageModal;
window.closeImageModal = closeImageModal;

// Initialize click-outside listener for image modal
document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === this) {
                closeImageModal();
            }
        });
    }
});
