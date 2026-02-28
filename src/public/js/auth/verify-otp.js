document.getElementById("formVerifyOtp").addEventListener("submit", function (e) {
    e.preventDefault();

    const otpInput = document.getElementById("otp");
    const otpValue = otpInput.value.trim();

    if (otpValue.length === 0) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Please enter the OTP code.' });
        return;
    }

    otpInput.value = otpValue;

    e.target.submit();
});

const formResend = document.getElementById("formResendOtp");
if (formResend) {
    formResend.addEventListener("submit", function (e) {
        const btn = this.querySelector('button');
        btn.innerHTML = 'Sending...';
        btn.disabled = true;
    });
}
