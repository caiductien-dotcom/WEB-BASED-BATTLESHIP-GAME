export const BASE_URL = "https://saas-backend-trcf.onrender.com"; 

async function postData(endpoint, data) {
    try {
        const token = localStorage.getItem("userToken");
        const response = await fetch(`${BASE_URL}/api${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
            },
            body: JSON.stringify(data),
        });

        if (response.status === 401) {
            localStorage.removeItem("userToken");
            localStorage.removeItem("userEmail");
            showAlert("OTP or Session expired!", false);
            setTimeout(() => { switchPage("login"); }, 5200);
            return { success: false, message: "Token expired. Logged out." };
        }

        return await response.json();
    } catch (error) {
        console.error("Fetch error:", error);
        return { success: false, message: "Can't connect to server" };
    }
}

const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
}

function showAlert(message, isSuccess = false) {
    const alertBox = document.getElementById("custom-alert");
    if (!alertBox) return;

    alertBox.style.cssText = `
        display: flex !important;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: ${isSuccess ? "#22c55e" : "#ef4444"};
        color: white;
        border-radius: 8px;
        padding: 12px 16px; /* Trả về padding gọn gàng như cũ */
        font-family: 'Inter', sans-serif;
        font-weight: 600;
        font-size: 14px;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        position: fixed;
        
        top: 24px; 
        left: 50%; 
        transform: translateX(-50%); 
        
        width: 340px;
        max-width: 90vw;
        z-index: 9999999; 
        animation: popIn 0.25s ease;
    `;
    alertBox.innerText = (isSuccess ? "✓  " : "✕  ") + message;

    clearTimeout(alertBox._hideTimer);
    alertBox._hideTimer = setTimeout(() => {
        alertBox.style.display = "none";
    }, 5000);
}

// Fix bug copy: Ep xu ly tao bo nho tam doc lap khong phu thuoc navigator bao mat
function enableActiveCopy(inputId) {
    const inputField = document.getElementById(inputId);
    if (!inputField) return;

    inputField.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
            const rawPassword = inputField.value;

            if (rawPassword.length > 0) {
                e.preventDefault();
                e.stopPropagation();

                const textArea = document.createElement("textarea");
                textArea.value = rawPassword;
                textArea.style.position = "fixed";
                textArea.style.opacity = "0";

                document.body.appendChild(textArea);
                textArea.select();

                try {
                    document.execCommand("copy");
                    console.log("Copied pass an thanh cong!");
                } catch (err) {
                    console.error("Khong the copy:", err);
                }

                document.body.removeChild(textArea);
            }
        }
    });
}

// Fix bug man hinh xanh trong tron: Ep hien thi dang flex de len body cua game
function switchPage(pageName) {
    const pages = {
        game: document.getElementById("game-page"),
        login: document.getElementById("login-page"),
        signup: document.getElementById("signup-page"),
        forgot: document.getElementById("forgot-page"),
        reset: document.getElementById("reset-page")
    };

    // An tat ca cac trang
    Object.values(pages).forEach(page => {
        if (page) {
            page.style.setProperty("display", "none", "important");
            page.style.pointerEvents = "none";
        }
    });

    const activePage = pages[pageName];
    if (!activePage) return;
    activePage.style.pointerEvents = "auto";

    // Neu vao man game thi hien block, cac man auth thi buoc phai hien flex de card can giua
    if (pageName === "game") {
        activePage.style.setProperty("display", "block", "important");
    } else {
        activePage.style.setProperty("display", "flex", "important");
    }
}

// Luong check token ban dau
window.addEventListener("DOMContentLoaded", () => {
    window.switchPage = switchPage;

    const token = localStorage.getItem("userToken");

    if (token) {
        switchPage("game");
    } else {
        switchPage("login");
    }
});

export { postData, getVal, showAlert, enableActiveCopy, switchPage };