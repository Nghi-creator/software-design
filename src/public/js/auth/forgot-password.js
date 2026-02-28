document.getElementById("formForgotPassword").addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    if (email === "") {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Please enter your email address.'
        });
        return;
    }

    const btnSubmit = event.target.querySelector('button[type="submit"]');
    btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending OTP...';
    btnSubmit.disabled = true;

    event.target.submit();
});
