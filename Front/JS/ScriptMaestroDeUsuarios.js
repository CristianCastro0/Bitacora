//=======================================
// ACORDEON SIDEBAR
//=======================================
const accordionHeaders = document.querySelectorAll(".accordion-header");

accordionHeaders.forEach((header) => {
  header.addEventListener("click", () => {
    const currentItem = header.parentElement;
    const isOpen = currentItem.classList.contains("active");

    document.querySelectorAll(".accordion-item").forEach((item) => {
      item.classList.remove("active");
    });

    if (!isOpen) {
      currentItem.classList.add("active");
    }
  });
});

function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " "); // colapsa espacios dobles/múltiples internos a uno solo
}

// Escapa texto antes de meterlo en un innerHTML. Sin esto, un nombre o
// correo con comillas puede romper el HTML generado (corta el
// atributo a la mitad) y perder datos silenciosamente. Bug real
// encontrado y corregido antes; se reaplica aquí.
function escaparHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Reparte un nombre completo (el único campo que devuelve ObtenerUsuarios,
// ej. "Juan Carlos Perez Gomez") en las 4 partes que pide
// ActualizarUsuario: primer nombre, segundo nombre, primer apellido,
// segundo apellido. Es una heurística "a ojo" pedida así a propósito,
// NO un dato ya separado que venga del backend — con nombres poco
// comunes puede repartir distinto de lo real. Lo ideal a futuro sigue
// siendo que ObtenerUsuarios devuelva estos 4 campos ya separados.
//
// Método: cada "parte" arranca en una palabra con mayúscula inicial;
// las palabras en minúscula (conectores como "de", "la", "del") se
// pegan a la palabra en mayúscula que sigue (ej. "de la Cruz" queda
// como una sola parte, no se corta ahí). Con 4 partes se reparte
// nombre/nombre2/apellido/apellido2 en ese orden. Con menos de 4, se
// prioriza dejar nombre + apellido llenos antes que dejar
// nombre2/apellido2 vacíos, que es lo más común en la práctica.
function repartirNombreCompleto(nombreCompleto) {
  const texto = (nombreCompleto || "").trim();
  if (!texto) return { nombre: "", nombre2: "", apellido: "", apellido2: "" };

  const partes = texto.match(/(?:[a-zñáéíóúü]+\s+)*[A-ZÑÁÉÍÓÚÜ][a-zA-ZñÑáéíóúÁÉÍÓÚüÜ]*/g) || [texto];

  switch (partes.length) {
    case 1:
      return { nombre: partes[0], nombre2: "", apellido: "", apellido2: "" };
    case 2:
      return { nombre: partes[0], nombre2: "", apellido: partes[1], apellido2: "" };
    case 3:
      return { nombre: partes[0], nombre2: "", apellido: partes[1], apellido2: partes[2] };
    case 4:
      return { nombre: partes[0], nombre2: partes[1], apellido: partes[2], apellido2: partes[3] };
    default:
      return {
        nombre: partes[0],
        nombre2: partes[1],
        apellido: partes[2],
        apellido2: partes.slice(3).join(" "),
      };
  }
}

// Catálogo de roles (para el <select> del modal) y mapa nombre->id de
// estados (para poder mandar EstadoId numérico, que es lo que pide
// RequestActualizarUsuario aunque en pantalla se maneje como texto).
let estadosPorNombre = new Map();

async function cargarCatalogos() {
  const selectRol = document.getElementById("editRol");

  try {
    const roles = await obtenerRoles();
    if (selectRol) {
      selectRol.innerHTML = '<option value="">Mantener rol actual</option>';
      roles.forEach((rol) => {
        const option = document.createElement("option");
        option.value = rol.id;
        option.textContent = rol.nombre;
        selectRol.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Error obteniendo roles:", error);
  }

  try {
    // OJO: no está confirmado que este catálogo de estados sea el mismo
    // que usa Usuario (Activo/Inactivo).
    const estados = await obtenerEstados();
    estadosPorNombre = new Map(estados.map((e) => [normalizarTexto(e.nombre || ""), e.id]));
  } catch (error) {
    console.error("Error obteniendo estados:", error);
  }
}

//========================================
// RENDER DE LA TABLA
//========================================
// Documento y Rol no vienen en ResponseConsultarUsuario todavía, así que
// se muestran como "N/D" en vez de inventar un valor.
function renderFilaUsuario(usuario) {
  const tr = document.createElement("tr");

  const columnas = [usuario.nombre ?? "", usuario.correo ?? "", usuario.rol ?? "N/D", usuario.estado ?? ""];
  columnas.forEach((texto) => {
    const td = document.createElement("td");
    td.textContent = texto;
    tr.appendChild(td);
  });

  const tdAcciones = document.createElement("td");
  tdAcciones.className = "action-cell";
  tdAcciones.innerHTML = `
    <div class="action-cell-inner">
      <button type="button" class="icon-action-btn edit-btn edit-trigger"
        data-id="${usuario.id}"
        data-nombre="${escaparHtml(usuario.nombre ?? "")}"
        data-correo="${escaparHtml(usuario.correo ?? "")}"
        data-rol="${escaparHtml(usuario.rol ?? "")}"
        data-estado="${escaparHtml(usuario.estado ?? "")}">
        <img src="Imagenes/Editar/editar.png" alt="Editar" class="action-icon" />
      </button>
    </div>
  `;
  tr.appendChild(tdAcciones);

  return tr;
}

function mostrarMensajeTabla(mensaje) {
  const tbody = document.getElementById("usuarioTableBody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">${escaparHtml(mensaje)}</td></tr>`;
}

async function cargarUsuariosTabla() {
  mostrarMensajeTabla("Cargando usuarios...");
  try {
    const usuarios = await obtenerUsuarios();
    const tbody = document.getElementById("usuarioTableBody");
    tbody.innerHTML = "";

    if (!usuarios || usuarios.length === 0) {
      mostrarMensajeTabla("No hay usuarios para mostrar.");
      return;
    }

    usuarios.forEach((usuario) => tbody.appendChild(renderFilaUsuario(usuario)));
    filtrarTabla();
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    mostrarMensajeTabla(`No se pudieron cargar los usuarios: ${error.message}`);
  }
}

//========================================
// FILTRO TABLA + PAGINACIÓN
//========================================
const searchInput = document.getElementById("searchInput");
const radioOptions = document.querySelectorAll(".radio-option");
const radioButtons = document.querySelectorAll('input[name="estadoFiltro"]');

const FILAS_POR_PAGINA = 10;
let paginaActual = 1;

const btnPaginaAnterior = document.getElementById("paginaAnteriorBtn");
const btnPaginaSiguiente = document.getElementById("paginaSiguienteBtn");
const indicadorPagina = document.getElementById("paginaIndicador");

function filtrarTabla() {
  const textoBusqueda = searchInput ? normalizarTexto(searchInput.value) : "";

  const radioSeleccionado = document.querySelector('input[name="estadoFiltro"]:checked');
  const estadoSeleccionado = radioSeleccionado ? normalizarTexto(radioSeleccionado.value) : "";

  const tableRows = Array.from(document.querySelectorAll("#usuarioTableBody tr"));
  const filasDeDatos = tableRows.filter((row) => row.children.length >= 5);

  const filasQueCoinciden = filasDeDatos.filter((row) => {
    const textoFila = normalizarTexto(row.textContent);
    const estadoFila = normalizarTexto(row.children[3].textContent);
    const coincideBusqueda = textoFila.includes(textoBusqueda);
    // Sin ningún filtro de estado activado, por defecto solo se ven (y se
    // pueden buscar) los usuarios Activos. Los Inactivos quedan
    // completamente ocultos —ni aparecen ni los encuentra la barra de
    // búsqueda— a menos que se prenda el filtro "Inactivos" a propósito.
    const coincideEstado = estadoSeleccionado ? estadoFila === estadoSeleccionado : estadoFila === normalizarTexto("Activo");
    return coincideBusqueda && coincideEstado;
  });

  const totalPaginas = Math.max(1, Math.ceil(filasQueCoinciden.length / FILAS_POR_PAGINA));
  if (paginaActual > totalPaginas) paginaActual = totalPaginas;
  if (paginaActual < 1) paginaActual = 1;

  const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
  const fin = inicio + FILAS_POR_PAGINA;
  const filasDeEstaPagina = new Set(filasQueCoinciden.slice(inicio, fin));

  filasDeDatos.forEach((row) => {
    row.style.display = filasDeEstaPagina.has(row) ? "" : "none";
  });

  if (indicadorPagina) {
    indicadorPagina.textContent =
      filasQueCoinciden.length === 0 ? "Sin resultados" : `Página ${paginaActual} de ${totalPaginas}`;
  }
  if (btnPaginaAnterior) btnPaginaAnterior.disabled = paginaActual <= 1;
  if (btnPaginaSiguiente) btnPaginaSiguiente.disabled = paginaActual >= totalPaginas;
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    paginaActual = 1;
    filtrarTabla();
  });
}

radioOptions.forEach((option) => {
  option.addEventListener("click", function (e) {
    e.preventDefault();

    const input = this.querySelector('input[name="estadoFiltro"]');
    const yaEstabaSeleccionado = input.checked;

    radioButtons.forEach((radio) => {
      radio.checked = false;
    });

    if (!yaEstabaSeleccionado) {
      input.checked = true;
    }

    paginaActual = 1;
    filtrarTabla();
  });
});

if (btnPaginaAnterior) {
  btnPaginaAnterior.addEventListener("click", () => {
    paginaActual -= 1;
    filtrarTabla();
  });
}

if (btnPaginaSiguiente) {
  btnPaginaSiguiente.addEventListener("click", () => {
    paginaActual += 1;
    filtrarTabla();
  });
}

//=========================================
// EDITAR Y ELIMINAR
//=========================================
document.addEventListener("DOMContentLoaded", () => {
  const editUserModal = document.getElementById("editUserModal");

  const closeEditUserModalBtn = document.getElementById("closeEditUserModalBtn");
  const cancelEditUserBtn = document.getElementById("cancelEditUserBtn");
  const saveEditUserBtn = document.getElementById("saveEditUserBtn");

  const editPrimerNombre = document.getElementById("editPrimerNombre");
  const editSegundoNombre = document.getElementById("editSegundoNombre");
  const editPrimerApellido = document.getElementById("editPrimerApellido");
  const editSegundoApellido = document.getElementById("editSegundoApellido");
  const editCorreo = document.getElementById("editCorreo");
  const editRol = document.getElementById("editRol");
  const editEstado = document.getElementById("editEstado");

  let usuarioEnEdicion = null; // { id }

  function abrirEditModal() {
    editUserModal.classList.add("show");
  }
  function cerrarEditModal() {
    editUserModal.classList.remove("show");
    usuarioEnEdicion = null;
  }

  // Busca en el <select> de Rol la opción cuyo texto coincida con el
  // nombre de rol que ya trae el usuario, y la deja seleccionada. Si no
  // encuentra coincidencia (rol distinto a los del catálogo, o el
  // catálogo no cargó a tiempo), se queda en "Mantener rol actual" en
  // vez de seleccionar algo que no corresponde.
  function seleccionarRolPorNombre(nombreRol) {
    const opciones = Array.from(editRol.options);
    const coincide = opciones.find(
      (o) => o.value !== "" && normalizarTexto(o.textContent) === normalizarTexto(nombreRol || "")
    );
    editRol.value = coincide ? coincide.value : "";
  }

  document.getElementById("usuarioTableBody").addEventListener("click", (e) => {
    const editTrigger = e.target.closest(".edit-trigger");

    if (editTrigger) {
      usuarioEnEdicion = {
        id: Number(editTrigger.dataset.id),
        correo: editTrigger.dataset.correo || "",
      };

      // Se precargan con el reparto automático (repartirNombreCompleto),
      // pero quedan editables: si el reparto adivinó mal, el usuario lo
      // corrige aquí mismo antes de guardar.
      const partesNombre = repartirNombreCompleto(editTrigger.dataset.nombre || "");
      editPrimerNombre.value = partesNombre.nombre;
      editSegundoNombre.value = partesNombre.nombre2;
      editPrimerApellido.value = partesNombre.apellido;
      editSegundoApellido.value = partesNombre.apellido2;

      editCorreo.value = editTrigger.dataset.correo || "";
      seleccionarRolPorNombre(editTrigger.dataset.rol);
      editEstado.value = editTrigger.dataset.estado || "Activo";

      abrirEditModal();
    }
  });

  saveEditUserBtn.addEventListener("click", async () => {
    if (!usuarioEnEdicion) return;

    const primerNombre = editPrimerNombre.value.trim();
    const primerApellido = editPrimerApellido.value.trim();
    if (!primerNombre || !primerApellido) {
      alert("Primer nombre y primer apellido no pueden quedar vacíos.");
      return;
    }

    const estadoId = estadosPorNombre.get(normalizarTexto(editEstado.value));
    if (!estadoId) {
      alert(
        `No se pudo determinar el id del estado "${editEstado.value}" contra el catálogo de /Estado/ObtenerEstados. ` +
          "Revisa con el equipo de backend si ese endpoint también cubre los estados de usuario."
      );
      return;
    }

    const request = {
      id: usuarioEnEdicion.id,
      // Se manda lo que quedó escrito en los 4 campos del modal, ya
      // corregido a mano si hacía falta — no se vuelve a repartir el
      // nombre completo original aquí.
      nombre: primerNombre,
      nombre2: editSegundoNombre.value.trim(),
      apellido: primerApellido,
      apellido2: editSegundoApellido.value.trim(),
      // El correo sí se conoce exacto (viene de ObtenerUsuarios y no se
      // edita en este modal), así que se reenvía tal cual en vez de null,
      // para no arriesgarse a que un UPDATE completo lo borre.
      correo: usuarioEnEdicion.correo || null,
      rolId: editRol.value !== "" ? Number(editRol.value) : null,
      estadoId,
    };

    saveEditUserBtn.disabled = true;
    try {
      await actualizarUsuario(request);
      cerrarEditModal();
      cargarUsuariosTabla();
    } catch (error) {
      console.error("Error actualizando usuario:", error);
      alert(`No se pudo guardar el usuario: ${error.message}`);
    } finally {
      saveEditUserBtn.disabled = false;
    }
  });

  closeEditUserModalBtn.addEventListener("click", cerrarEditModal);
  cancelEditUserBtn.addEventListener("click", cerrarEditModal);

  editUserModal.addEventListener("click", (e) => {
    if (e.target === editUserModal) cerrarEditModal();
  });

  cargarCatalogos();
  cargarUsuariosTabla();
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
