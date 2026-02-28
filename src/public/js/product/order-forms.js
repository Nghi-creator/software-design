/**
 * Order Forms Module
 * Handles payment and shipping form preview, validation, and submission.
 */

/**
 * Setup image preview for file inputs
 * @param {HTMLInputElement} input - The file input element
 * @param {string} previewId - ID of the container for previews
 */
function setupImagePreview(input, previewId) {
    const preview = document.getElementById(previewId);
    if (!preview) return;

    preview.innerHTML = '';

    if (input.files) {
        Array.from(input.files).forEach(file => {
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                Swal.fire({
                    icon: 'warning',
                    title: 'File Too Large!',
                    text: `File "${file.name}" exceeds the 5MB limit.`,
                    confirmButtonColor: '#72AEC8'
                });
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                const col = document.createElement('div');
                col.className = 'col-4 mb-2';
                col.innerHTML = `
                    <div class="image-preview rounded overflow-hidden shadow-sm" style="position: relative; height: 100px;">
                        <img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover; border: 1px solid #dee2e6;">
                    </div>
                `;
                preview.appendChild(col);
            };
            reader.readAsDataURL(file);
        });
    }
}

/**
 * Handle payment form submission (Buyer)
 * @param {Event} event 
 * @param {string} orderId 
 */
async function submitPayment(event, orderId) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = document.getElementById('submitPaymentBtn');
    const paymentMethod = form.querySelector('[name="payment_method"]').value;
    const shippingAddress = form.querySelector('[name="shipping_address"]').value.trim();
    const shippingPhone = form.querySelector('[name="shipping_phone"]').value.trim();
    const paymentProofInput = document.getElementById('paymentProofInput');

    // 1. Validations
    if (!paymentMethod) {
        Swal.fire({
            icon: 'error',
            title: 'Missing Info',
            text: 'Please select a payment method.',
            confirmButtonColor: '#72AEC8'
        });
        document.getElementById('paymentMethod').focus();
        return;
    }

    if (!paymentProofInput.files || paymentProofInput.files.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'No Proof Uploaded',
            text: 'Please upload at least 1 image showing your payment receipt.',
            confirmButtonColor: '#72AEC8'
        });
        paymentProofInput.focus();
        return;
    }

    if (paymentProofInput.files.length > 3) {
        Swal.fire({ icon: 'warning', title: 'Limit Exceeded', text: 'Maximum 3 images allowed.', confirmButtonColor: '#72AEC8' });
        return;
    }

    if (!shippingAddress) {
        Swal.fire({ icon: 'error', title: 'Missing Address', text: 'Please enter your delivery address.', confirmButtonColor: '#72AEC8' });
        document.getElementById('shippingAddress').focus();
        return;
    }

    if (!shippingPhone || !/^[0-9]{10,11}$/.test(shippingPhone)) {
        Swal.fire({ icon: 'error', title: 'Invalid Phone', text: 'Please enter a valid 10-11 digit phone number.', confirmButtonColor: '#72AEC8' });
        document.getElementById('shippingPhone').focus();
        return;
    }

    // 2. Processing
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Submitting...';

    try {
        // Step A: Upload images
        const formData = new FormData();
        Array.from(paymentProofInput.files).forEach(file => {
            formData.append('images', file);
        });

        const uploadResponse = await fetch('/products/order/upload-images', {
            method: 'POST',
            body: formData
        });

        if (!uploadResponse.ok) throw new Error('Image upload failed. Please try smaller images.');

        const uploadResult = await uploadResponse.json();

        // Step B: Submit payment record
        const data = {
            payment_method: paymentMethod,
            payment_proof_urls: uploadResult.urls,
            note: form.querySelector('[name="note"]').value,
            shipping_address: shippingAddress,
            shipping_phone: shippingPhone
        };

        const response = await fetch(`/products/order/${orderId}/submit-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            await Swal.fire({
                icon: 'success',
                title: 'Payment Submitted!',
                text: 'The seller will be notified to confirm your payment.',
                timer: 2500,
                showConfirmButton: false
            });
            location.reload();
        } else {
            Swal.fire({ icon: 'error', title: 'Submission Failed', text: result.error || 'Unable to submit payment data.' });
        }
    } catch (error) {
        console.error('Submit payment error:', error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Something went wrong while processing: ' + error.message });
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-send"></i> Submit Payment Proof';
    }
}

/**
 * Handle shipping information update (Seller)
 * @param {Event} event 
 * @param {string} orderId 
 */
async function submitShipping(event, orderId) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = document.getElementById('submitShippingBtn');
    const trackingNumber = form.querySelector('[name="tracking_number"]').value.trim();
    const shippingProvider = form.querySelector('[name="shipping_provider"]').value;
    const shippingProofInput = document.getElementById('shippingProofInput');

    // 1. Validations
    if (!trackingNumber) {
        Swal.fire({ icon: 'error', title: 'Missing Info', text: 'Please enter the tracking number.', confirmButtonColor: '#72AEC8' });
        document.getElementById('trackingNumber').focus();
        return;
    }

    if (!shippingProvider) {
        Swal.fire({ icon: 'error', title: 'Missing Info', text: 'Please select a shipping carrier.', confirmButtonColor: '#72AEC8' });
        document.getElementById('shippingProvider').focus();
        return;
    }

    // 2. Processing
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Updating...';

    try {
        let imageUrls = [];

        // Optional: upload shipping proof images
        if (shippingProofInput.files && shippingProofInput.files.length > 0) {
            if (shippingProofInput.files.length > 2) {
                Swal.fire({ icon: 'warning', title: 'Limit Exceeded', text: 'Maximum 2 images allowed for shipping proof.', confirmButtonColor: '#72AEC8' });
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-truck"></i> Update Shipping';
                return;
            }

            const formData = new FormData();
            Array.from(shippingProofInput.files).forEach(file => {
                formData.append('images', file);
            });

            const uploadResponse = await fetch('/products/order/upload-images', {
                method: 'POST',
                body: formData
            });

            if (!uploadResponse.ok) throw new Error('Proof image upload failed.');

            const uploadResult = await uploadResponse.json();
            imageUrls = uploadResult.urls;
        }

        const data = {
            tracking_number: trackingNumber,
            shipping_provider: shippingProvider,
            shipping_proof_urls: imageUrls,
            note: form.querySelector('[name="note"]').value
        };

        const response = await fetch(`/products/order/${orderId}/submit-shipping`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            await Swal.fire({
                icon: 'success',
                title: 'Shipping Updated!',
                text: 'The bidder will be notified that the item is in transit.',
                timer: 2500,
                showConfirmButton: false
            });
            location.reload();
        } else {
            Swal.fire({ icon: 'error', title: 'Update Failed', text: result.error || 'Failed to update shipping status.' });
        }
    } catch (error) {
        console.error('Submit shipping error:', error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Something went wrong: ' + error.message });
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-truck"></i> Update Shipping';
    }
}

/**
 * Initialize all order forms
 * @param {string} orderId 
 */
function initOrderForms(orderId) {
    // 1. Payment Proof Preview
    document.getElementById('paymentProofInput')?.addEventListener('change', function (e) {
        setupImagePreview(e.target, 'paymentProofPreview');
    });

    // 2. Shipping Proof Preview
    document.getElementById('shippingProofInput')?.addEventListener('change', function (e) {
        setupImagePreview(e.target, 'shippingProofPreview');
    });

    // 3. Form Submission Event Listeners
    document.getElementById('paymentForm')?.addEventListener('submit', function (e) {
        submitPayment(e, orderId);
    });

    document.getElementById('shippingForm')?.addEventListener('submit', function (e) {
        submitShipping(e, orderId);
    });
}

// Global exposure
window.initOrderForms = initOrderForms;
