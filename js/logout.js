const btnLogout = document.getElementById("btn-logout");

if (btnLogout) {
    btnLogout.addEventListener("click", () => {
        localStorage.removeItem("userToken");
        localStorage.removeItem("userEmail");
        sessionStorage.clear();
        window.location.href = "https://haduyminh5a1.github.io/Frontend/pages/login2.html";
    });
}