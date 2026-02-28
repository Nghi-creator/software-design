/**
 * Admin Category Management
 * Shared JS for category list, add, edit, and detail pages.
 * Dependencies: jQuery ($), SweetAlert2 (Swal)
 */

/**
 * Initialize category form validation (used by Add + Edit).
 * @param {string} formSelector - jQuery selector for the form, e.g. '#formAddCategory'
 */
function initCategoryFormValidation(formSelector) {
    $(formSelector).on('submit', function (e) {
        const name = $('#txtName').val().trim();

        if (!name) {
            e.preventDefault();
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Category name is required!'
            });
            return false;
        }
    });
}

/**
 * Confirm and delete a category (used by List + Detail).
 * Requires a hidden form with id="formDelete" and input id="txtDeleteId".
 * @param {string|number} id - Category ID
 * @param {string} name - Category name (for display)
 */
function confirmDeleteCategory(id, name) {
    Swal.fire({
        title: 'Are you sure?',
        html: `You are about to delete category: <strong>${name}</strong>.<br>This action cannot be undone!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            const form = document.getElementById('formDelete');
            document.getElementById('txtDeleteId').value = id;
            form.submit();
        }
    });
}
