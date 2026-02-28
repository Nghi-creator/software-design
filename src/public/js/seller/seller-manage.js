/**
 * Seller Product Management Module
 * Handles description updates and appends for active products
 */

window.SellerManage = (function ($) {
    let quillEditor;
    let quillEditors = {}; // Store multiple editors for edit mode
    let currentProductId = null;
    let currentProductName = '';

    /**
     * Initialize Quill editor for Appending Description
     */
    function initAppendModal() {
        $('#appendDescModal').on('shown.bs.modal', function () {
            if (!quillEditor) {
                quillEditor = new Quill('#quill-editor-container', {
                    theme: 'snow',
                    placeholder: 'Enter additional description...',
                    modules: {
                        toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                            [{ 'color': [] }, { 'background': [] }],
                            ['link', 'image'],
                            ['clean']
                        ]
                    }
                });
            } else {
                quillEditor.setContents([]);
            }
        });

        $('.btn-append-desc').on('click', function (e) {
            e.preventDefault();
            currentProductId = $(this).data('id');
            currentProductName = $(this).data('name');

            $('#modalProductName').text(currentProductName);
            $('#appendDescModal').modal('show');
        });

        $('#btnSaveAppendDesc').on('click', handleAppendSubmit);
    }

    /**
     * Handle Append Description Submission
     */
    function handleAppendSubmit() {
        const $btn = $(this);
        if ($btn.prop('disabled')) return;

        const description = quillEditor.root.innerHTML.trim();
        if (!description || description === '<p><br></p>') {
            Swal.fire({ icon: 'warning', title: 'Empty Description', text: 'Please enter some description content.' });
            return;
        }

        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Saving...');

        $.ajax({
            url: `/seller/products/${currentProductId}/append-description`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ description }),
            success: function (response) {
                Swal.fire({ icon: 'success', title: 'Success!', text: response.message || 'Description appended successfully.', timer: 1500, showConfirmButton: false });
                $('#appendDescModal').modal('hide');
            },
            error: function (xhr) {
                Swal.fire({ icon: 'error', title: 'Error!', text: xhr.responseJSON?.message || 'Failed to append description.' });
            },
            complete: function () {
                $btn.prop('disabled', false).html('<i class="bi bi-check-circle me-1"></i>Save & Append');
            }
        });
    }

    /**
     * Initialize Edit Description Updates
     */
    function initEditUpdates() {
        $('.btn-edit-updates').on('click', function (e) {
            e.preventDefault();
            const productId = $(this).data('id');
            const productName = $(this).data('name');

            $('#editUpdatesModalLabel').text('Edit Description Updates - ' + productName);
            $('#editUpdatesBody').html('<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-2">Loading updates...</p></div>');
            $('#editUpdatesModal').modal('show');

            loadUpdates(productId);
        });

        // Event delegation for dynamically loaded content
        $(document).on('click', '.btn-save-update', handleSaveUpdate);
        $(document).on('click', '.btn-delete-update', handleDeleteUpdate);
    }

    /**
     * Load updates via AJAX
     */
    function loadUpdates(productId) {
        $.ajax({
            url: `/seller/products/${productId}/description-updates`,
            method: 'GET',
            success: function (response) {
                if (response.updates && response.updates.length > 0) {
                    renderUpdates(response.updates);
                } else {
                    renderEmptyState();
                }
            },
            error: function (xhr) {
                $('#editUpdatesBody').html(`<div class="alert alert-danger"><i class="bi bi-exclamation-triangle me-2"></i>Failed to load updates: ${xhr.responseJSON?.message || 'Unknown error'}</div>`);
            }
        });
    }

    /**
     * Render updates list
     */
    function renderUpdates(updates) {
        let html = '<div class="accordion" id="updatesAccordion">';
        updates.forEach((update, index) => {
            const updateDate = new Date(update.created_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            html += `
                <div class="accordion-item shadow-none border mb-2">
                    <h2 class="accordion-header" id="heading${update.id}">
                        <button class="accordion-button ${index === 0 ? '' : 'collapsed'} py-2" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${update.id}">
                            <i class="bi bi-calendar3 me-2"></i> ${updateDate}
                        </button>
                    </h2>
                    <div id="collapse${update.id}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" data-bs-parent="#updatesAccordion">
                        <div class="accordion-body p-3">
                            <div id="editor-${update.id}" class="mb-3" style="height: 200px;"></div>
                            <div class="d-flex justify-content-end gap-2">
                                <button type="button" class="btn btn-sm btn-primary btn-save-update" data-update-id="${update.id}">
                                    <i class="bi bi-check-circle me-1"></i>Save Changes
                                </button>
                                <button type="button" class="btn btn-sm btn-danger btn-delete-update" data-update-id="${update.id}">
                                    <i class="bi bi-trash-fill me-1"></i>Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        $('#editUpdatesBody').html(html);

        updates.forEach(update => {
            quillEditors[update.id] = new Quill(`#editor-${update.id}`, {
                theme: 'snow',
                modules: {
                    toolbar: [[{ 'header': [1, 2, 3, false] }], ['bold', 'italic', 'underline', 'strike'], [{ 'list': 'ordered' }, { 'list': 'bullet' }], [{ 'color': [] }, { 'background': [] }], ['link', 'image'], ['clean']]
                }
            });
            quillEditors[update.id].root.innerHTML = update.content;
        });
    }

    function renderEmptyState() {
        $('#editUpdatesBody').html(`<div class="text-center py-5 text-muted"><i class="bi bi-inbox fs-1"></i><p class="mt-3">No description updates found for this product.</p></div>`);
    }

    /**
     * Handle individual update save
     */
    function handleSaveUpdate() {
        const $btn = $(this);
        if ($btn.prop('disabled')) return;

        const updateId = $btn.data('update-id');
        const editor = quillEditors[updateId];
        if (!editor) return;

        const content = editor.root.innerHTML.trim();
        if (!content || content === '<p><br></p>') {
            Swal.fire({ icon: 'warning', title: 'Empty Content', text: 'Please enter some content.' });
            return;
        }

        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Saving...');

        $.ajax({
            url: `/seller/products/description-updates/${updateId}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ content }),
            success: function (response) {
                Swal.fire({ icon: 'success', title: 'Success!', text: response.message || 'Updated successfully.', timer: 1500, showConfirmButton: false });
            },
            error: function (xhr) {
                Swal.fire({ icon: 'error', title: 'Error!', text: xhr.responseJSON?.message || 'Failed to save update.' });
            },
            complete: function () {
                $btn.prop('disabled', false).html('<i class="bi bi-check-circle me-1"></i>Save Changes');
            }
        });
    }

    /**
     * Handle individual update deletion
     */
    function handleDeleteUpdate() {
        const updateId = $(this).data('update-id');

        Swal.fire({
            title: 'Delete Update?',
            text: 'Are you sure you want to delete this description update? This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, delete it!',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({ title: 'Deleting...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

                $.ajax({
                    url: `/seller/products/description-updates/${updateId}`,
                    method: 'DELETE',
                    success: function (response) {
                        Swal.fire({ icon: 'success', title: 'Deleted!', text: response.message || 'Deleted successfully.', timer: 1500, showConfirmButton: false }).then(() => {
                            location.reload();
                        });
                    },
                    error: function (xhr) {
                        Swal.fire({ icon: 'error', title: 'Error!', text: xhr.responseJSON?.message || 'Failed to delete update.' });
                    }
                });
            }
        });
    }

    /**
     * Handle auction cancellation (for pending auctions)
     */
    function handleCancelAuction() {
        const $btn = $(this);
        const id = $btn.data('id');
        const name = $btn.data('name');
        const bidderId = $btn.data('bidder-id');

        Swal.fire({
            title: 'Cancel Auction?',
            text: `Are you sure you want to cancel the auction for "${name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, cancel it!',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({ title: 'Processing...', html: 'Cancelling auction...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

                fetch(`/seller/products/${id}/cancel`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ highest_bidder_id: bidderId, reason: 'The bidder did not pay as agreed' })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            Swal.fire('Cancelled!', 'The auction has been cancelled.', 'success').then(() => {
                                window.location.href = '/seller/products/pending?message=cancelled';
                            });
                        } else {
                            Swal.fire('Error!', data.message || 'Failed to cancel auction', 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Cancel error:', error);
                        Swal.fire('Error!', 'Failed to cancel auction', 'error');
                    });
            }
        });
    }

    /**
     * Initialize the entire module
     */
    function init() {
        initAppendModal();
        initEditUpdates();

        // Listener for cancel buttons
        $(document).on('click', '.btn-cancel', handleCancelAuction);
    }

    return {
        init
    };
})(jQuery);
