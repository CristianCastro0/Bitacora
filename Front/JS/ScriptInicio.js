
const accordionHeaders = document.querySelectorAll(".accordion-header");

accordionHeaders.forEach((header) => {
  header.addEventListener("click", () => {
    const currentItem = header.parentElement;
    const currentContent = header.nextElementSibling;
    const isOpen = currentItem.classList.contains("active");

    document.querySelectorAll(".accordion-item").forEach((item) => {
      item.classList.remove("active");
      item.querySelector(".accordion-content").style.display = "none";
    });

    if (!isOpen) {
      currentItem.classList.add("active");
      currentContent.style.display = "block";
    }
  });
});

//=========================
// SESIÓN / USUARIO ACTUAL
//=========================
document.addEventListener("DOMContentLoaded", () => {
  const usuario = requerirSesion(); // manda a Login.html si no hay sesión
  if (!usuario) return;

  const correoUsuarioActual = document.getElementById("correoUsuarioActual");
  if (correoUsuarioActual) correoUsuarioActual.textContent = usuario.correo || "Usuario";

  const cerrarSesionBtn = document.getElementById("cerrarSesionBtn");
  if (cerrarSesionBtn) cerrarSesionBtn.addEventListener("click", cerrarSesion);
});



