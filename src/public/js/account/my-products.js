/**
 * Delete Product Handler
 * Handles the click event on '.btn-delete-product' buttons.
 */
document.querySelectorAll('.btn-delete-product').forEach(btn => {
    btn.addEventListener('click', function (e) {
        e.preventDefault();
        const productId = this.getAttribute('data-product-id');

        if (confirm('Are you sure you want to delete this product?')) {
            fetch(`/seller/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        location.reload();
                    } else {
                        alert('Error: ' + (data.message || 'Failed to delete product'));
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert('Error deleting product');
                });
        }
    });
});
