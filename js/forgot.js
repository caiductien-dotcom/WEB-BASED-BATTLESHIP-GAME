(function () {
    function handleLogout() {
        // Xóa token và thông tin người dùng khỏi storage
        localStorage.removeItem("userToken");
        localStorage.removeItem("userEmail");
        sessionStorage.clear();
        window.location.href = "https://haduyminh5a1.github.io/Frontend/pages/login2.html";
    }

    document.addEventListener("DOMContentLoaded", () => {
        const btnLogout = document.getElementById("btn-logout");
        if (btnLogout) {
            btnLogout.addEventListener("click", handleLogout);
        }
    });

    if (document.readyState !== "loading") {
        const btnLogout = document.getElementById("btn-logout");
        if (btnLogout) {
            btnLogout.addEventListener("click", handleLogout);
        }
    }
})();