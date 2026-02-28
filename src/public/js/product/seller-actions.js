/**
 * Product Detail Page - Seller Actions (Reject/Unreject Bidder)
 */

function initSellerActions(productId) {
    // Reject Bidder
    document.querySelectorAll('.reject-bidder-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const bidderId = this.getAttribute('data-bidder-id');
            const bidderName = this.getAttribute('data-bidder-name');
            confirmRejectBidder(productId, bidderId, bidderName, this);
        });
    });

    // Unreject Bidder
    document.querySelectorAll('.unreject-bidder-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const bidderId = this.getAttribute('data-bidder-id');
            const bidderName = this.getAttribute('data-bidder-name');
            confirmUnrejectBidder(productId, bidderId, bidderName, this);
        });
    });
}

function confirmRejectBidder(productId, bidderId, bidderName, btn) {
    Swal.fire({
        title: 'Reject Bidder?',
        html: `Are you sure you want to reject bidder <strong>"${bidderName}"</strong>?<br><br>This bidder will not be able to bid on this product anymore.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, reject',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            performAction('/products/reject-bidder', { productId, bidderId }, btn, '<i class="bi bi-x-circle"></i>');
        }
    });
}

function confirmUnrejectBidder(productId, bidderId, bidderName, btn) {
    Swal.fire({
        title: 'Unban Bidder?',
        html: `Allow <strong>"${bidderName}"</strong> to bid on this product again?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, allow',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            performAction('/products/unreject-bidder', { productId, bidderId }, btn, '<i class="bi bi-check-circle"></i>');
        }
    });
}

function performAction(url, body, btn, originalIcon) {
    btn.disabled = true;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                Swal.fire({
                    title: 'Success!',
                    text: data.message || 'Action completed successfully.',
                    icon: 'success',
                    confirmButtonColor: '#72AEC8'
                }).then(() => window.location.reload());
            } else {
                Swal.fire({
                    title: 'Error!',
                    text: data.message || 'Action failed.',
                    icon: 'error',
                    confirmButtonColor: '#72AEC8'
                });
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error!',
                text: 'An error occurred while processing the request.',
                icon: 'error',
                confirmButtonColor: '#72AEC8'
            });
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        });
}

// Export
window.initSellerActions = initSellerActions;
