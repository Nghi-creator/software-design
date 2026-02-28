document.getElementById("formSignin").addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    if (email === "") {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Email is required.'
        });
        return;
    }

    const password = document.getElementById("password").value;
    if (password === "") {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Password is required.'
        });
        return;
    }

    event.target.submit();
});
