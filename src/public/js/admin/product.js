/**
 * Admin Product Management — Shared Utilities
 * Used across product list, detail, add, and edit pages.
 * Dependencies: SweetAlert2 (Swal)
 */

/**
 * Show a field validation error with SweetAlert + Bootstrap visual feedback.
 * @param {string} inputId - DOM id of the input element
 * @param {string} errorId - DOM id of the error message element
 * @param {string} message - Error message to display
 * @param {boolean} [useDisplay=false] - Use style.display instead of classList
 * @returns {false} Always returns false to allow `if (!validate...) return;` pattern
 */
function showFieldError(inputId, errorId, message, useDisplay) {
    var inputEl = document.getElementById(inputId);
    var errorEl = document.getElementById(errorId);
    inputEl.classList.add('is-invalid');
    if (useDisplay) {
        errorEl.style.display = 'block';
    } else {
        errorEl.classList.add('d-block');
    }
    inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    inputEl.focus();
    Swal.fire({ icon: 'error', title: 'Error', text: message, confirmButtonColor: '#72AEC8' });
    return false;
}

/**
 * Bind "clear error on input" handlers for a list of fields.
 * @param {Array<{inputId: string, errorId: string, event?: string, useDisplay?: boolean}>} fields
 */
function bindClearErrors(fields) {
    fields.forEach(function (f) {
        var el = document.getElementById(f.inputId);
        if (!el) return;
        el.addEventListener(f.event || 'input', function () {
            this.classList.remove('is-invalid');
            if (f.useDisplay) {
                document.getElementById(f.errorId).style.display = 'none';
            } else {
                document.getElementById(f.errorId).classList.remove('d-block');
            }
        });
    });
}

/**
 * Confirm and delete a product (used by List + Detail).
 * Requires a hidden form with id="formDelete" and input id="txtDeleteId".
 * @param {string|number} id - Product ID
 * @param {string} name - Product name (for display)
 */
function confirmDeleteProduct(id, name) {
    Swal.fire({
        title: 'Are you sure?',
        html: 'You are about to delete product: <strong>' + name + '</strong>.<br>This action cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    }).then(function (result) {
        if (result.isConfirmed) {
            var form = document.getElementById('formDelete');
            document.getElementById('txtDeleteId').value = id;
            form.submit();
        }
    });
}

/**
 * Parse a Cleave-formatted price string to an integer.
 * @param {string} val - e.g. "1,000,000"
 * @returns {number} parsed integer, or NaN
 */
function parsePrice(val) {
    return parseInt((val || '').replace(/,/g, ''), 10);
}
