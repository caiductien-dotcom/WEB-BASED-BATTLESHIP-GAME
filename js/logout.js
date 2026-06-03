const btnLogout = document.getElementById("btn-logout");

if (btnLogout) {
    btnLogout.addEventListener("click", () => {
        localStorage.removeItem("userToken");
        localStorage.removeItem("userEmail");
        sessionStorage.clear();
        window.switchPage("login"); // ← Quay ve login trong SPA
    });
}