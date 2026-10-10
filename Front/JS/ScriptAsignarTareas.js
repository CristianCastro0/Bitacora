// ===============================
// ACORDEON SIDEBAR
// ===============================
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
    .replace(/\s+/g, " "); // colapsa espacios dobles/multiples internos a uno solo
}

// Escapa texto antes de meterlo en un innerHTML — mismo arreglo
// aplicado en el resto de pantallas (evita que comillas en un nombre
// o descripción corten el HTML generado).
function escaparHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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

//=========================
// CARGA DE TAREAS SIN REFERENCIA
//=========================
let tareasCache = [];

function mostrarMensajeTabla(mensaje) {
  const tbody = document.getElementById("tareaTableBody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">${escaparHtml(mensaje)}</td></tr>`;
}

function crearAccionesCelda(tarea) {
  const td = document.createElement("td");
  td.className = "action-cell";

  const tipo = document.createElement("template");
  const codigoSeguro = escaparHtml(tarea.codigo ?? "");
  const descripcionSegura = escaparHtml(tarea.descripcion ?? "");
  const seniorSeguro = escaparHtml(tarea.senior ?? "");

  // Mismo patrón ya probado en las otras pantallas: el centrado va en
  // el <div> interno (.action-cell-inner), no en el <td> directamente,
  // para que la celda se estire bien con la altura real de la fila.
  tipo.innerHTML = `
    <div class="action-cell-inner">
      <button type="button" class="icon-action-btn asignar-tarea-btn asignar-tarea-trigger"
         data-id-tarea="${tarea.id}"
         data-codigo="${codigoSeguro}"
         data-descripcion="${descripcionSegura}"
         data-senior="${seniorSeguro}"
         title="Asignar a un ticket">
        <img src="Imagenes/Editar/Asignar.png" alt="Asignar a ticket" class="action-icon" />
      </button>
    </div>
  `;
  td.append(...tipo.content.childNodes);
  return td;
}

function renderFilaTarea(tarea) {
  const tr = document.createElement("tr");

  const columnas = [
    tarea.codigo ?? "",
    tarea.descripcion ?? "",
    tarea.campana ?? "N/D",
    tarea.etapa ?? "N/D",
    tarea.horasTrabajadas ?? "0",
    tarea.senior ?? "N/D",
  ];

  columnas.forEach((texto) => {
    const td = document.createElement("td");
    td.textContent = texto;
    tr.appendChild(td);
  });

  tr.appendChild(crearAccionesCelda(tarea));
  return tr;
}

async function cargarTareas() {
  mostrarMensajeTabla("Cargando tareas...");
  try {
    const tareas = await consultarTareasSinReferencia();
    tareasCache = tareas || [];

    const tbody = document.getElementById("tareaTableBody");
    tbody.innerHTML = "";

    if (tareasCache.length === 0) {
      mostrarMensajeTabla("No hay tareas sin asignar por ahora.");
      return;
    }

    tareasCache.forEach((tarea) => tbody.appendChild(renderFilaTarea(tarea)));
    filtrarTabla();
  } catch (error) {
    console.error("Error obteniendo tareas:", error);
    mostrarMensajeTabla(`No se pudieron cargar las tareas: ${error.message}`);
  }
}

cargarTareas();

//=========================
// FILTRO TABLA + PAGINACIÓN
//=========================
const searchInput = document.getElementById("searchInput");

const FILAS_POR_PAGINA = 10;
let paginaActual = 1;

const btnPaginaAnterior = document.getElementById("paginaAnteriorBtn");
const btnPaginaSiguiente = document.getElementById("paginaSiguienteBtn");
const indicadorPagina = document.getElementById("paginaIndicador");

function filtrarTabla() {
  const textoBusqueda = searchInput ? normalizarTexto(searchInput.value) : "";

  const tableRows = Array.from(document.querySelectorAll("#tareaTableBody tr"));
  const filasDeDatos = tableRows.filter((row) => row.children.length >= 7);

  const filasQueCoinciden = filasDeDatos.filter((row) => normalizarTexto(row.textContent).includes(textoBusqueda));

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

//=========================
// CARGA DE TICKETS (para el buscador del modal)
//=========================
let ticketsPorCodigo = new Map();

async function cargarTicketsParaDatalist() {
  const datalist = document.getElementById("ticketsParaTareaList");
  if (!datalist) return;

  try {
    const tickets = await obtenerTicketsAsignacion();
    ticketsPorCodigo = new Map();
    datalist.innerHTML = "";

    (tickets || []).forEach((ticket) => {
      ticketsPorCodigo.set(normalizarTexto(ticket.codigoTicket || ""), ticket);
      const opcion = document.createElement("option");
      opcion.value = ticket.codigoTicket;
      opcion.label = ticket.senior || "";
      datalist.appendChild(opcion);
    });
  } catch (error) {
    console.error("Error obteniendo tickets para el buscador:", error);
  }
}

cargarTicketsParaDatalist();

//=========================
// MODAL ASIGNAR TAREA A TICKET
//=========================
const asignarTareaModal = document.getElementById("asignarTareaModal");
const tareaModalCodigo = document.getElementById("tareaModalCodigo");
const tareaModalDescripcion = document.getElementById("tareaModalDescripcion");
const tareaModalSenior = document.getElementById("tareaModalSenior");
const tareaModalTicketInput = document.getElementById("tareaModalTicketInput");
const buscarTicketTareaBtn = document.getElementById("buscarTicketTareaBtn");
const ticketSeleccionadoTarea = document.getElementById("ticketSeleccionadoTarea");
const saveAsignarTareaBtn = document.getElementById("saveAsignarTareaBtn");

let tareaEnAsignacion = null; // { idTarea }
let ticketElegido = null; // { idTicket, codigoTicket }

function abrirAsignarTareaModal() {
  if (asignarTareaModal) asignarTareaModal.classList.add("show");
}

function cerrarAsignarTareaModal() {
  if (asignarTareaModal) asignarTareaModal.classList.remove("show");
  tareaEnAsignacion = null;
  ticketElegido = null;
  if (tareaModalTicketInput) tareaModalTicketInput.value = "";
  if (ticketSeleccionadoTarea) ticketSeleccionadoTarea.innerHTML = "";
}

function mostrarTicketElegido() {
  if (!ticketSeleccionadoTarea) return;
  ticketSeleccionadoTarea.innerHTML = "";
  if (!ticketElegido) return;

  const chip = document.createElement("div");
  chip.className = "collaborator-chip";
  chip.innerHTML = `
    <div class="collaborator-chip-badge"></div>
    <span class="collaborator-chip-text">${escaparHtml(ticketElegido.codigoTicket)}</span>
    <button type="button" class="collaborator-chip-remove">×</button>
  `;
  chip.querySelector(".collaborator-chip-remove").addEventListener("click", () => {
    ticketElegido = null;
    mostrarTicketElegido();
  });
  ticketSeleccionadoTarea.appendChild(chip);
}

document.getElementById("tareaTableBody").addEventListener("click", (e) => {
  const trigger = e.target.closest(".asignar-tarea-trigger");
  if (!trigger) return;

  tareaEnAsignacion = { idTarea: Number(trigger.dataset.idTarea) };
  ticketElegido = null;

  tareaModalCodigo.value = trigger.dataset.codigo || "";
  tareaModalDescripcion.value = trigger.dataset.descripcion || "";
  tareaModalSenior.value = trigger.dataset.senior || "";

  mostrarTicketElegido();
  abrirAsignarTareaModal();
});

document.getElementById("closeAsignarTareaModalBtn").addEventListener("click", cerrarAsignarTareaModal);
document.getElementById("cancelAsignarTareaBtn").addEventListener("click", cerrarAsignarTareaModal);
asignarTareaModal.addEventListener("click", (e) => {
  if (e.target === asignarTareaModal) cerrarAsignarTareaModal();
});

if (buscarTicketTareaBtn) {
  buscarTicketTareaBtn.addEventListener("click", () => {
    if (!tareaModalTicketInput) return;
    const ticket = ticketsPorCodigo.get(normalizarTexto(tareaModalTicketInput.value.trim()));
    if (!ticket) {
      alert("No se encontró ningún ticket con ese código.");
      return;
    }
    ticketElegido = { idTicket: ticket.idTicket, codigoTicket: ticket.codigoTicket };
    mostrarTicketElegido();
    tareaModalTicketInput.value = "";
  });
}

if (tareaModalTicketInput) {
  tareaModalTicketInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (buscarTicketTareaBtn) buscarTicketTareaBtn.click();
    }
  });
}

saveAsignarTareaBtn.addEventListener("click", async () => {
  if (!tareaEnAsignacion) return;

  if (!ticketElegido) {
    alert("Busca y selecciona el ticket destino antes de asignar.");
    return;
  }

  saveAsignarTareaBtn.disabled = true;
  try {
    await referenciarTarea(tareaEnAsignacion.idTarea, ticketElegido.idTicket);
    alert("Tarea asignada correctamente");
    cerrarAsignarTareaModal();
    cargarTareas();
  } catch (error) {
    console.error("Error asignando la tarea:", error);
    alert(`No se pudo asignar la tarea: ${error.message}`);
  } finally {
    saveAsignarTareaBtn.disabled = false;
  }
});
