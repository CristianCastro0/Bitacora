function normalizarTextoLogin(texto) {
  return texto
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " "); // colapsa espacios dobles/múltiples internos a uno solo
}

document.addEventListener("DOMContentLoaded", () => {
  // Si ya hay una sesión guardada, no tiene sentido pedir el login de
  // nuevo: se manda directo a donde corresponda.
  if (sessionStorage.getItem("usuarioActual")) {
    location.href = paginaDeVuelta();
    return;
  }

  const form = document.getElementById("loginForm");
  const usuarioInput = document.getElementById("loginUsuario");
  const errorEl = document.getElementById("loginError");
  const loginBtn = document.getElementById("loginBtn");

  function paginaDeVuelta() {
    const params = new URLSearchParams(location.search);
    const volver = params.get("volver");
    // Solo se acepta un nombre de archivo .html simple, para no abrir la
    // puerta a que ese parámetro mande a cualquier URL externa.
    if (volver && /^[A-Za-z0-9_]+\.html$/.test(volver)) {
      return volver;
    }
    return "Inicio.html";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const usuario = usuarioInput.value.trim();
    if (!usuario) return;

    errorEl.hidden = true;
    loginBtn.disabled = true;
    loginBtn.textContent = "Ingresando...";

    try {
      const datos = await autenticarLocal(usuario);

      // Dos condiciones para dejar pasar: rol Administrador Y estado
      // Activo. OJO: esto es una primera capa desde el front, para que
      // alguien que entre por la pantalla normal reciba un aviso claro —
      // NO es una restricción de seguridad real, porque AutenticarLocal
      // ya dejó la sesión (cookie) activa en el backend antes de que
      // este chequeo se ejecute. Alguien que le pegue directo a la API
      // se saltaría esto sin problema. La validación real tiene que
      // quedar en el backend, dentro de AutenticarLocal, antes de crear
      // la sesión.
      const usuarios = await obtenerUsuarios();
      const usuarioLogueado = usuarios.find((u) => u.id === datos.id);
      const esAdministrador =
        usuarioLogueado && normalizarTextoLogin(usuarioLogueado.rol || "") === "administrador";
      const estaActivo = usuarioLogueado && normalizarTextoLogin(usuarioLogueado.estado || "") === "activo";

      if (!estaActivo) {
        cerrarSesion();
        errorEl.textContent = "Tu usuario está inactivo. Contacta a un administrador.";
        errorEl.hidden = false;
        loginBtn.disabled = false;
        loginBtn.textContent = "Ingresar";
        return;
      }

      if (!esAdministrador) {
        cerrarSesion(); // por si acaso guardó algo, no deja nada en sessionStorage
        errorEl.textContent = "Solo los administradores pueden acceder a esta herramienta.";
        errorEl.hidden = false;
        loginBtn.disabled = false;
        loginBtn.textContent = "Ingresar";
        return;
      }

      guardarUsuarioSesion(datos);
      location.href = paginaDeVuelta();
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      // apiFetch ya trae el mensaje real del backend (usuario no
      // encontrado en AD / sin acceso a la herramienta / etc.).
      errorEl.textContent = error.message;
      errorEl.hidden = false;
      loginBtn.disabled = false;
      loginBtn.textContent = "Ingresar";
    }
  });
});
