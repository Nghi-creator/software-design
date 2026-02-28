/**
 * Rate Seller Handler
 * Handles the click event for rating/editing seller ratings on won auctions.
 * Dependencies: jQuery ($), SweetAlert2 (Swal)
 */
$(document).on('click', '.btn-rate-seller, .btn-edit-rate-seller', function (e) {
    e.preventDefault();
    const $btn = $(this);
    const productId = $btn.data('product-id');
    const sellerName = $btn.data('seller-name');
    const sellerId = $btn.data('seller-id');
    const isEdit = $btn.hasClass('btn-edit-rate-seller');

    // Get existing rating data if editing
    let existingRating = null;
    let existingComment = '';
    if (isEdit) {
        existingRating = $btn.data('rating');
        existingComment = $btn.data('comment') || '';
    }

    Swal.fire({
        title: isEdit ? `Edit Rating for ${sellerName}` : `Rate ${sellerName}`,
        html: `
            <div class="mb-3">
                <label class="form-label">Rating:</label>
                <div class="btn-group w-100" role="group">
                    <input type="radio" class="btn-check" name="rating" id="rating-positive" value="positive" autocomplete="off" ${existingRating === 'positive' ? 'checked' : ''}>
                    <label class="btn btn-outline-success" for="rating-positive">
                        <i class="bi bi-hand-thumbs-up"></i> Positive
                    </label>
                    
                    <input type="radio" class="btn-check" name="rating" id="rating-negative" value="negative" autocomplete="off" ${existingRating === 'negative' ? 'checked' : ''}>
                    <label class="btn btn-outline-danger" for="rating-negative">
                        <i class="bi bi-hand-thumbs-down"></i> Negative
                    </label>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Comment (optional):</label>
                <textarea class="form-control" id="rating-comment" rows="3" placeholder="Write your comment...">${existingComment}</textarea>
            </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#72AEC8',
        cancelButtonColor: '#6c757d',
        confirmButtonText: isEdit ? 'Update Rating' : 'Submit Rating',
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
            Swal.fire({
                title: 'Processing...',
                html: isEdit ? 'Updating rating...' : 'Submitting rating...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const method = isEdit ? 'PUT' : 'POST';
            const endpoint = `/account/won-auctions/${productId}/rate-seller`;

            fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    seller_id: sellerId,
                    rating: result.value.rating,
                    comment: result.value.comment
                })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire('Success!', isEdit ? 'Rating updated successfully.' : 'Rating submitted successfully.', 'success')
                            .then(() => {
                                window.location.reload();
                            });
                    } else {
                        Swal.fire('Error!', data.message || 'Failed to submit rating', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    Swal.fire('Error!', 'Failed to submit rating', 'error');
                });
        }
    });
});
