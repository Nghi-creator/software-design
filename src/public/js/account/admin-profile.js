/**
 * Admin Profile Form Validation
 * Validates password fields before submitting the profile update form.
 * Dependencies: SweetAlert2 (Swal)
 */
document.getElementById("formAdminProfile").addEventListener("submit", function (e) {
    e.preventDefault();

    const newPass = document.getElementById("new_password").value;
    const confirmPass = document.getElementById("confirm_new_password").value;
    const oldPass = document.getElementById("old_password").value;

    if (!oldPass) {
        Swal.fire({
            icon: 'warning',
            title: 'Authentication Required',
            text: 'Please enter your current password to confirm these changes.'
        });
        document.getElementById("old_password").focus();
        return;
    }

    if (newPass || confirmPass) {
        if (newPass !== confirmPass) {
            Swal.fire({ icon: 'error', title: 'Mismatch', text: 'New passwords do not match.' });
            return;
        }
    }

    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

    e.target.submit();
});
