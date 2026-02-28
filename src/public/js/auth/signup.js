document.getElementById("formSignup").addEventListener("submit", function (event) {
    event.preventDefault();

    const fullname = document.getElementById("fullname").value.trim();
    const address = document.getElementById("address").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (fullname === "") {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Full name is required.' });
        return;
    }

    if (address === "") {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Address is required.' });
        return;
    }

    if (email === "") {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Email is required.' });
        return;
    }

    if (password === "") {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Password is required.' });
        return;
    }

    if (confirmPassword === "") {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Confirm password is required.' });
        return;
    }

    if (password !== confirmPassword) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Passwords do not match.' });
        return;
    }

    const captchaResponse = grecaptcha.getResponse();
    if (captchaResponse.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Verification Required',
            text: 'Please check the "I\'m not a robot" box.'
        });
        return;
    }

    const btnSubmit = event.target.querySelector('button[type="submit"]');
    btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';
    btnSubmit.disabled = true;

    event.target.submit();
});
