import { isPasswordStrong } from "./auth.js";
import { postData, getVal, showAlert, enableActiveCopy, switchPage } from "./utils.js";

let resendTimer;
let otpExpiryTimer;

// Ham kich hoat dem nguoc thoi gian gui lai ma OTP
function startResendCountdown(duration) {
    let timeLeft = duration;
    const btnResend = document.getElementById("btnResend");
    if (!btnResend) return;

    btnResend.classList.add("disable");
    clearInterval(resendTimer);

    resendTimer = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(resendTimer);
            btnResend.classList.remove("disable");
            btnResend.innerText = "Resend code";
        } else {
            btnResend.innerText = `Resend after (${timeLeft}s)`;
            timeLeft--;
        }
    }, 1000);
}

// Ham kich hoat dem nguoc thoi gian ton tai cua ma OTP
function startOTPExpiryCountdown(duration) {
    let timeLeft = duration;
    const countdownDisplay = document.getElementById("countdown");
    if (!countdownDisplay) return;

    clearInterval(otpExpiryTimer);
    otpExpiryTimer = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(otpExpiryTimer);
            countdownDisplay.innerText = "OTP expired!";
            countdownDisplay.style.color = "#ff4b4b";
        } else {
            countdownDisplay.innerText = `OTP valid time left: ${timeLeft}s`;
            timeLeft--;
        }
    }, 1000);
}

// Ham khoi tao bo dem khi man hinh Reset OTP mo ra cong khai
export function initOTPSystem() {
    startResendCountdown(30);
    startOTPExpiryCountdown(60);
}

const btnResend = document.getElementById("btnResend");
if (btnResend) {
    btnResend.onclick = (e) => {
        e.preventDefault();
        resendOTP();
    };
}

// Xu ly gui email xin cap ma OTP
async function handleForgotPassword() {
    const email = getVal("email-forgot"); // Lay dung ID o nhap email o vung Forgot
    if (!email) return showAlert("Please enter your email");

    const result = await postData("/forgot-password", { email });
    const msg = result.message || result.msg || (result.success ? "OTP sent!" : "Failed to send OTP.");
    showAlert(msg, result.success);

    if (result.success) {
        localStorage.setItem("resetEmail", email);
        setTimeout(() => {
            switchPage("reset"); // Chuyen sang man nhap OTP tai cho
            initOTPSystem();     // Kich hoat luon bo dem nguoc
        }, 2000);
    }
}

// Xu ly kiem tra ma OTP va doi mat khau moi (All-in-one)
async function handleResetAllInOne() {
    const email = localStorage.getItem("resetEmail");
    const otp = getVal("otp");
    const newPassword = getVal("resetNewPassword"); // Lay dung ID o nhap pass moi
    const confirmPassword = getVal("confirmPassword");

    if (!email) {
        showAlert("OTP expired. Please request OTP again.");
        return switchPage("forgot");
    }
    if (!otp) {
        return showAlert("Please enter OTP");
    }
    if (!isPasswordStrong(newPassword)) {
        return showAlert("This password is not strong enough");
    }
    if (newPassword !== confirmPassword) {
        return showAlert("Passwords do not match!");
    }

    const result = await postData("/reset-password", { email, otp, newPassword });
    const msg = result.message || result.msg || (result.success ? "Password reset!" : "Reset failed.");
    showAlert(msg, result.success);

    if (result.success) {
        localStorage.removeItem("resetEmail");
        clearInterval(resendTimer);
        clearInterval(otpExpiryTimer);
        setTimeout(() => {
            switchPage("login"); // Doi thanh cong da ve man Login choi game luon
        }, 2000);
    }
}

// Xu ly bam nut gui lai ma OTP
async function resendOTP() {
    const email = localStorage.getItem("resetEmail");

    if (!email) {
        showAlert("OTP expired. Please enter your email again.");
        switchPage("forgot");
        return;
    }

    const result = await postData("/resend-otp", { email });
    const msg = result.message || result.msg || (result.success ? "OTP resent!" : "Failed to resend OTP.");
    showAlert(msg, result.success);

    if (result.success) {
        initOTPSystem();
    }
}

// Gan su kien click cho cac nut hanh dong
const btnForgot = document.getElementById("btnForgot");
const btnResetAll = document.getElementById("btnResetAll");

if (btnForgot) btnForgot.onclick = handleForgotPassword;
if (btnResetAll) btnResetAll.onclick = handleResetAllInOne;

// Lang nghe su kien doi mat an hien mat khau cho man hinh Reset
const setupTogglePassword = (inputId, toggleId) => {
    const input = document.getElementById(inputId);
    const toggleBtn = document.getElementById(toggleId);

    if (input && toggleBtn) {
        toggleBtn.onclick = (e) => {
            e.preventDefault();
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            toggleBtn.textContent = isPassword ? '🙈' : '👁';
        };
    }
};

setupTogglePassword('resetNewPassword', 'toggleNewPassword');
setupTogglePassword('confirmPassword', 'toggleConfirmPassword');

// Kich hoat copy an chu dong
enableActiveCopy("resetNewPassword");
enableActiveCopy("confirmPassword");

// Xu ly thoi gian thuc kiem tra form de mo khoa nut Doi mat khau
const resetOtpInput = document.getElementById("otp");
const resetNewPassInput = document.getElementById("resetNewPassword");
const resetConfirmPassInput = document.getElementById("confirmPassword");

if (resetOtpInput && resetNewPassInput && resetConfirmPassInput && btnResetAll) {
    btnResetAll.disabled = true;

    const checkResetFields = () => {
        const otpVal = resetOtpInput.value.trim();
        const newPassVal = resetNewPassInput.value;
        const confirmPassVal = resetConfirmPassInput.value;
        const passMsg = document.getElementById("reset-pass-msg");

        // Validate real-time do manh mat khau hien thi thong bao nho ben duoi
        if (newPassVal.length > 0) {
            if (isPasswordStrong(newPassVal)) {
                if (passMsg) {
                    passMsg.innerText = "";
                    passMsg.style.display = "none";
                }
            } else {
                if (passMsg) {
                    passMsg.innerText = " Need 8+ chars, upper, lower, number & special symbol";
                    passMsg.style.color = "red";
                    passMsg.style.display = "block";
                }
            }
        } else {
            if (passMsg) passMsg.style.display = "none";
        }

        // Dieu kien mo khoa nut: Du 4 so OTP, pass manh va trung khop nhau
        if (otpVal.length === 4 && isPasswordStrong(newPassVal) && newPassVal === confirmPassVal) {
            btnResetAll.disabled = false;
        } else {
            btnResetAll.disabled = true;
        }
    };

    resetOtpInput.addEventListener("input", checkResetFields);
    resetNewPassInput.addEventListener("input", checkResetFields);
    resetConfirmPassInput.addEventListener("input", checkResetFields);
}