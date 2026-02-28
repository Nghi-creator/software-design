document.getElementById("formResetPass").addEventListener("submit", function (e) {
    e.preventDefault();

    const newPass = document.getElementById("new_password").value;
    const confirmPass = document.getElementById("confirm_new_password").value;

    if (newPass.trim() === "" || confirmPass.trim() === "") {
        Swal.fire({
            icon: 'error',
            title: 'Incomplete',
            text: 'Please fill in all password fields.'
        });
        return;
    }

    if (newPass !== confirmPass) {
        Swal.fire({
            icon: 'error',
            title: 'Mismatch',
            text: 'Passwords do not match. Please try again.'
        });
        return;
    }

    const btn = e.target.querySelector("button[type='submit']");
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Updating...';
    btn.disabled = true;

    e.target.submit();
});
