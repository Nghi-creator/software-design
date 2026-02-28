/**
 * Seller Rating Module
 * Handles rating and editing ratings for bidders/winners
 */

window.SellerRate = (function ($) {
    /**
     * Show rating modal (Create or Edit)
     * @param {Object} options - Modal options
     */
    function showModal(options) {
        const {
            productId,
            bidderName,
            bidderId,
            isEdit = false,
            existingRating = null,
            existingComment = '',
            onSuccess = () => window.location.reload()
        } = options;

        Swal.fire({
            title: isEdit ? `Edit Rating for ${bidderName}` : `Rate ${bidderName}`,
            html: `
                <div class="mb-3 text-start">
                    <label class="form-label fw-bold">Rating:</label>
                    <div class="btn-group w-100" role="group">
                        <input type="radio" class="btn-check" name="rating" id="rating-positive" value="positive" autocomplete="off" ${existingRating === 'positive' ? 'checked' : ''}>
                        <label class="btn btn-outline-success py-2" for="rating-positive">
                            <i class="bi bi-hand-thumbs-up-fill me-1"></i> Positive
                        </label>
                        
                        <input type="radio" class="btn-check" name="rating" id="rating-negative" value="negative" autocomplete="off" ${existingRating === 'negative' ? 'checked' : ''}>
                        <label class="btn btn-outline-danger py-2" for="rating-negative">
                            <i class="bi bi-hand-thumbs-down-fill me-1"></i> Negative
                        </label>
                    </div>
                </div>
                <div class="mb-3 text-start">
                    <label class="form-label fw-bold">Comment (optional):</label>
                    <textarea class="form-control" id="rating-comment" rows="3" placeholder="Write your feedback here...">${existingComment}</textarea>
                </div>
            `,
            showCancelButton: true,
            confirmButtonColor: '#72AEC8',
            cancelButtonColor: '#6c757d',
            confirmButtonText: isEdit ? 'Update Rating' : 'Submit Rating',
            reverseButtons: true,
            preConfirm: () => {
                const rating = document.querySelector('input[name="rating"]:checked');
                const comment = document.getElementById('rating-comment').value;

                if (!rating) {
                    Swal.showValidationMessage('Please select a rating');
                    return false;
                }

                return {
                    rating: rating.value,
                    comment: comment
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                submitRating({
                    productId,
                    bidderId,
                    rating: result.value.rating,
                    comment: result.value.comment,
                    isEdit,
                    onSuccess
                });
            }
        });
    }

    /**
     * Submit rating to server
     */
    function submitRating({ productId, bidderId, rating, comment, isEdit, onSuccess }) {
        Swal.fire({
            title: 'Processing...',
            html: isEdit ? 'Updating your rating...' : 'Submitting your rating...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const method = isEdit ? 'PUT' : 'POST';
        const endpoint = `/seller/products/${productId}/rate`;

        fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                highest_bidder_id: bidderId,
                rating: rating,
                comment: comment
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: isEdit ? 'Rating updated successfully.' : 'Rating submitted successfully.',
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        onSuccess();
                    });
                } else {
                    Swal.fire('Error!', data.message || 'Failed to process rating', 'error');
                }
            })
            .catch(error => {
                console.error('Rating error:', error);
                Swal.fire('Error!', 'An unexpected error occurred. Please try again.', 'error');
            });
    }

    /**
     * Initialize listeners for rating buttons
     */
    function init() {
        $(document).on('click', '.btn-rate, .btn-edit-rate', function (e) {
            e.preventDefault();
            const $btn = $(this);
            const data = $btn.data();

            showModal({
                productId: data.id,
                bidderName: data.bidder,
                bidderId: data.bidderId,
                isEdit: $btn.hasClass('btn-edit-rate'),
                existingRating: data.rating,
                existingComment: data.comment
            });
        });
    }

    return {
        init,
        showModal
    };
})(jQuery);
