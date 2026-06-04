import { postData, getVal, showAlert, enableActiveCopy, switchPage } from "./utils.js";

async function handleSignup() {
    const name = getVal("name");
    const email = getVal("email");
    const password = getVal("newPassword");

    if (!isValidEmail(email)) return showAlert("Invalid email!");
    if (!isPasswordStrong(password)) return showAlert("Password not strong enough!");

    const result = await postData("/signup", { name, email, password });
    const msg = result.message || result.msg || (result.success ? "Sign up successful!" : "Sign up failed.");
    showAlert(msg, result.success);

    if (result.success) {
        setTimeout(() => { switchPage("login"); }, 2000);
    }
}

async function handleLogin() {
    const email = getVal("email");
    const password = getVal("password");

    if (!email || !password) return showAlert("Please enter email and password.");

    const btn = document.getElementById("btnLogin");
    if (!btn) return;

    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Connecting... (may take ~30s)";

    try {
        const result = await postData("/login", { email, password });
        const msg = result.message || result.msg || (result.success ? "Login successful!" : "Login failed.");
        showAlert(msg, result.success);

        if (result.success) {
            const token = result.token || result.accessToken || result.data?.token;
            if (!token) return showAlert("Login succeeded but no token received.");

            localStorage.setItem("userToken", token);
            localStorage.setItem("userEmail", email);

            setTimeout(() => { switchPage("game"); }, 2000);
        }
    } catch (err) {
        showAlert("Server is unavailable. Please wait 30 seconds and try again.");
    } finally {
        const currentToken = localStorage.getItem("userToken");

        if (!currentToken) {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    }
}

export function isPasswordStrong(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])(?=.*\d).{8,}$/.test(password);
}

export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Khoi tao toan bo su kien khi trang web san sang chay (Chong chet nut bam)
function initAuthEvents() {
    const passwordInput = document.getElementById("newPassword");
    const signupBtn = document.getElementById("btnSignup");
    const emailInput = document.getElementById("email");
    const loginEmailInput = document.getElementById("email");
    const loginPasswordInput = document.getElementById("password");
    const loginBtnElement = document.getElementById("btnLogin");

    // Xu ly real-time Dang ky
    if (passwordInput && signupBtn) {
        signupBtn.disabled = true;

        passwordInput.addEventListener("input", (e) => {
            const msg = document.getElementById("pass-msg");
            const val = e.target.value;

            if (msg) {
                if (isPasswordStrong(val)) {
                    msg.style.display = "none";
                    signupBtn.disabled = false;
                } else {
                    msg.innerText = " Need 8+ chars, uppercase, lowercase, number & symbol";
                    msg.style.color = "red";
                    msg.style.display = "block";
                    signupBtn.disabled = true;
                }

                // FIX LOGIC: Ep nut khoa xam lai neu nguoi dung xoa trang o nhap
                if (val === "") {
                    msg.style.display = "none";
                    signupBtn.disabled = true;
                }
            }
        });
    }

    if (emailInput) {
        emailInput.addEventListener("input", (e) => {
            const msg = document.getElementById("email-msg");

            if (!msg) return;

            const val = e.target.value.trim();

            if (isValidEmail(val) || val === "") {
                msg.style.display = "none";
            } else {
                msg.innerText = " Invalid email format";
                msg.style.color = "red";
                msg.style.display = "block";
            }
        });
    }

    // Xu ly khoa xam nut Login mac dinh
    if (loginEmailInput && loginPasswordInput && loginBtnElement) {
        loginBtnElement.disabled = true;

        const checkLoginFields = () => {
            loginBtnElement.disabled = !(
                isValidEmail(loginEmailInput.value.trim()) &&
                loginPasswordInput.value.length > 0
            );
        };

        loginEmailInput.addEventListener("input", checkLoginFields);
        loginPasswordInput.addEventListener("input", checkLoginFields);
    }

    if (signupBtn) signupBtn.onclick = handleSignup;
    if (loginBtnElement) loginBtnElement.onclick = handleLogin;

    // Fix con mat: Ep gan su kien click doi icon chuan chi
    const setupTogglePassword = (inputId, toggleId) => {
        const input = document.getElementById(inputId);
        const toggleBtn = document.getElementById(toggleId);

        if (input && toggleBtn) {
            toggleBtn.onclick = (e) => {
                e.preventDefault();

                const isPassword = input.type === "password";

                input.type = isPassword ? "text" : "password";
                toggleBtn.textContent = isPassword ? "🙈" : "👁";
            };
        }
    };

    setupTogglePassword("password", "toggleLoginPassword");
    setupTogglePassword("newPassword", "toggleSignupPassword");

    enableActiveCopy("password");
    enableActiveCopy("newPassword");
}

// Kich hoat ngay khi DOM tai xong
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAuthEvents);
} else {
    initAuthEvents();
}