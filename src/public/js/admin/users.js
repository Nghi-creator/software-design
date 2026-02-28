/**
 * Admin User Management — Shared JS
 * Used across user list, add, edit, detail, and upgrade request pages.
 * Dependencies: jQuery ($), SweetAlert2 (Swal)
 */

/**
 * Confirm and delete a user (used by List + Detail).
 * Requires a hidden form with id="formDelete" and input id="txtDeleteId".
 * @param {string|number} id - User ID
 * @param {string} name - User name (for display)
 */
function confirmDeleteUser(id, name) {
    Swal.fire({
        title: 'Are you sure?',
        html: 'You are about to delete user: <strong>' + (name || '#' + id) + '</strong>.<br>This action cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete user!',
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
 * Initialize user form validation (used by Add + Edit).
 * @param {string} formSelector - jQuery selector for the form
 * @param {object} [options]
 * @param {boolean} [options.requirePassword=false] - Whether to validate password fields
 */
function initUserFormValidation(formSelector, options) {
    var opts = options || {};
    $(formSelector).on('submit', function (e) {
        var fullname = $('#txtFullname').val().trim();
        var email = $('#txtEmail').val().trim();
        var address = $('#txtAddress').val().trim();

        if (!fullname || !email || !address) {
            e.preventDefault();
            Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Please fill in all required fields!' });
            return false;
        }

        // Email validation
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            e.preventDefault();
            Swal.fire({ icon: 'error', title: 'Invalid Email', text: 'Please enter a valid email address!' });
            return false;
        }

        // Password validation (only for Add form)
        if (opts.requirePassword) {
            var password = $('#txtPassword').val();
            var confirmPassword = $('#txtConfirmPassword').val();

            if (!password || !confirmPassword) {
                e.preventDefault();
                Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Please fill in all required fields!' });
                return false;
            }

            if (password !== confirmPassword) {
                e.preventDefault();
                Swal.fire({ icon: 'error', title: 'Password Mismatch', text: 'Password and Confirm Password do not match!' });
                return false;
            }
        }
    });
}

/**
 * Initialize reset password button handler (used by Edit).
 */
function initResetPassword() {
    $('#btnResetPassword').on('click', function (e) {
        e.preventDefault();
        var userName = $(this).data('user-name');

        Swal.fire({
            title: 'Reset Password?',
            html: 'Are you sure you want to reset password for <strong>' + userName + '</strong> to default password?<br><br><small class="text-muted">Default password: <code>123</code></small>',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, reset it!',
            cancelButtonText: 'Cancel'
        }).then(function (result) {
            if (result.isConfirmed) {
                $('#formResetPassword').submit();
            }
        });
    });
}

/**
 * Initialize upgrade request approve/reject buttons (used by upgradeRequests).
 */
function initUpgradeActions() {
    document.querySelectorAll('.btn-approve').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            var form = this.closest('form');

            Swal.fire({
                title: 'Approve Upgrade?',
                text: 'This user will be promoted to Seller immediately.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#198754',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Yes, Approve!'
            }).then(function (result) {
                if (result.isConfirmed) {
                    form.submit();
                }
            });
        });
    });

    document.querySelectorAll('.btn-reject').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            var form = this.closest('form');
            var noteInput = form.querySelector('input[name="admin_note"]');

            Swal.fire({
                title: 'Reject Request?',
                text: 'Please provide a reason for rejection:',
                input: 'textarea',
                inputPlaceholder: 'Reason for rejection (optional)...',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Yes, Reject'
            }).then(function (result) {
                if (result.isConfirmed) {
                    noteInput.value = result.value || '';
                    form.submit();
                }
            });
        });
    });
}
