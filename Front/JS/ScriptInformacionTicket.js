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

// Escapa texto antes de meterlo en un innerHTML. Sin esto, una
// descripción o nombre con comillas puede romper el HTML generado
// (corta el atributo a la mitad) y perder datos silenciosamente.
function escaparHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatearFecha(fechaIso) {
  if (!fechaIso) return "N/D";
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return "N/D";
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${fecha.getFullYear()}`;
}

//========================================
// RENDER DE LA TABLA
//========================================
// Fuente: GET /Ticket/ConsultarTicketsGrilla → ResponseConsultarTicket
// (confirmado en el código real: Id, Codigo, Senior, Estado,
// Descripcion, FechaCreacion). OJO: este DTO NO trae Campaña — no es
// un dato faltante por conectar, simplemente no existe en este
// endpoint (tampoco en el SP SPR_GET_TICKETS_GRILLA ni en la carga
// del CSV), así que esa columna se queda en "N/D" a propósito.
function renderFilaInformacion(ticket) {
  const idTicket = ticket.id;
  const tr = document.createElement("tr");
  tr.dataset.idTicket = idTicket;

  const columnas = [
    ticket.codigo ?? "",
    ticket.senior ?? "Pendiente",
    ticket.campana ?? "N/D", // no existe en el backend (ver nota arriba)
    ticket.estado ?? "",
    ticket.descripcion ?? "N/D",
    formatearFecha(ticket.fechaCreacion),
  ];

  columnas.forEach((texto) => {
    const td = document.createElement("td");
    td.textContent = texto;
    tr.appendChild(td);
  });

  const tdDetalle = document.createElement("td");
  const btnDetalle = document.createElement("button");
  btnDetalle.type = "button";
  btnDetalle.className = "detalle-trigger";
  btnDetalle.textContent = "Ver más";
  btnDetalle.dataset.idTicket = idTicket;
  tdDetalle.appendChild(btnDetalle);
  tr.appendChild(tdDetalle);

  return tr;
}

function mostrarMensajeTabla(mensaje) {
  const tbody = document.getElementById("InformationTableBody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">${escaparHtml(mensaje)}</td></tr>`;
}

// Se pide UNA sola vez (se asume que ConsultarTicketsGrilla no recibe
// filtro) y de ahí en adelante el filtro por estado y la búsqueda se
// aplican en el front sobre esta misma copia, sin volver a pedir al API.
let ticketsGrilla = [];

async function cargarInformacionTickets() {
  mostrarMensajeTabla("Cargando tickets...");
  try {
    const tickets = await consultarTicketsGrilla();
    ticketsGrilla = tickets || [];
    const tbody = document.getElementById("InformationTableBody");
    tbody.innerHTML = "";

    if (ticketsGrilla.length === 0) {
      mostrarMensajeTabla("No hay tickets para mostrar.");
      return;
    }

    ticketsGrilla.forEach((ticket) => tbody.appendChild(renderFilaInformacion(ticket)));
    filtrarTabla();
  } catch (error) {
    console.error("Error obteniendo tickets:", error);
    mostrarMensajeTabla(`No se pudieron cargar los tickets: ${error.message}`);
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

  const tableRows = Array.from(document.querySelectorAll("#InformationTableBody tr"));

  // Filas reales de datos (se excluye la fila de mensaje "Cargando..."/"No hay tickets...")
  const filasDeDatos = tableRows.filter((row) => row.children.length >= 4);

  const filasQueCoinciden = filasDeDatos.filter((row) => {
    const textoFila = normalizarTexto(row.textContent);
    const estadoFila = normalizarTexto(row.children[3].textContent);
    const coincideBusqueda = textoFila.includes(textoBusqueda);
    const coincideEstado = !estadoSeleccionado || estadoFila === estadoSeleccionado;
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
    paginaActual = 1; // toda búsqueda nueva vuelve a empezar en la página 1
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

    paginaActual = 1; // todo cambio de filtro vuelve a empezar en la página 1
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

//========================================
// MODAL DE DETALLE (no existía en el HTML original; se agrega porque
// la columna "Detalles" no tenía ninguna acción real detrás)
//========================================
function crearModalDetalle() {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = "detalleTicketModal";
  overlay.innerHTML = `
    <div class="edit-modal">
      <div class="edit-modal-header">
        <h2>Detalle del ticket</h2>
        <button class="close-modal-btn" type="button" id="closeDetalleModalBtn">✕</button>
      </div>
      <div class="edit-modal-body" id="detalleModalBody">
        <p>Cargando...</p>
      </div>
      <div class="edit-modal-footer">
        <button type="button" class="btn-secondary" id="cerrarDetalleModalBtn">CERRAR</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) cerrarModalDetalle();
  });
  document.getElementById("closeDetalleModalBtn").addEventListener("click", cerrarModalDetalle);
  document.getElementById("cerrarDetalleModalBtn").addEventListener("click", cerrarModalDetalle);

  return overlay;
}

function cerrarModalDetalle() {
  const overlay = document.getElementById("detalleTicketModal");
  if (overlay) overlay.classList.remove("show");
}

async function abrirModalDetalle(idTicket) {
  let overlay = document.getElementById("detalleTicketModal");
  if (!overlay) overlay = crearModalDetalle();

  const body = document.getElementById("detalleModalBody");
  body.innerHTML = "<p>Cargando...</p>";
  overlay.classList.add("show");

  try {
    const detalle = await obtenerDetalleTicket(idTicket);
    const colaboradores =
      detalle.colaboradores && detalle.colaboradores.length > 0
        ? detalle.colaboradores.map((c) => c.nombreColaborador).join(", ")
        : "Sin colaboradores registrados";

    body.innerHTML = `
      <div class="form-group"><label>Código</label><input type="text" value="${escaparHtml(detalle.codigo ?? "")}" readonly /></div>
      <div class="form-group"><label>Tipo</label><input type="text" value="${escaparHtml(detalle.tipo ?? "N/D")}" readonly /></div>
      <div class="form-group"><label>Fecha</label><input type="text" value="${escaparHtml(formatearFecha(detalle.fecha))}" readonly /></div>
      <div class="form-group"><label>Horas asignadas</label><input type="text" value="${escaparHtml(detalle.horasAsignadas ?? "N/D")}" readonly /></div>
      <div class="form-group"><label>Descripción</label><input type="text" value="${escaparHtml(detalle.descripcion ?? "N/D")}" readonly /></div>
      <div class="form-group"><label>Colaboradores</label><input type="text" value="${escaparHtml(colaboradores)}" readonly /></div>
    `;
  } catch (error) {
    console.error("Error obteniendo detalle del ticket:", error);
    body.innerHTML = `<p>No se pudo cargar el detalle: ${escaparHtml(error.message)}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("InformationTableBody");
  if (!tbody) return;

  tbody.addEventListener("click", (e) => {
    const trigger = e.target.closest(".detalle-trigger");
    if (!trigger) return;
    abrirModalDetalle(Number(trigger.dataset.idTicket));
  });

  cargarInformacionTickets();
});

//========================================
// CARGA DE CSV (botón debajo de la barra de búsqueda)
//========================================
document.addEventListener("DOMContentLoaded", () => {
  const csvFileInput = document.getElementById("csvFileInput");
  const csvUploadBtn = document.getElementById("csvUploadBtn");
  const csvUploadStatus = document.getElementById("csvUploadStatus");

  if (!csvFileInput || !csvUploadBtn) return;

  csvUploadBtn.addEventListener("click", () => csvFileInput.click());

  csvFileInput.addEventListener("change", async () => {
    const archivo = csvFileInput.files[0];
    if (!archivo) return;

    csvUploadBtn.disabled = true;
    if (csvUploadStatus) csvUploadStatus.textContent = `Cargando ${archivo.name}...`;

    try {
      const resultado = await cargarTicketsCsv(archivo);
      const cantidad = resultado?.ticketsProcesados ?? 0;
      alert(`Se procesaron ${cantidad} tickets del archivo.`);
      cargarInformacionTickets(); // refresca la tabla con lo que se acaba de cargar
    } catch (error) {
      console.error("Error cargando el CSV:", error);
      alert(
        `No se pudo cargar el archivo: ${error.message}\n\n` +
          "El CSV debe tener las columnas: number, short_description, opened_at."
      );
    } finally {
      csvUploadBtn.disabled = false;
      if (csvUploadStatus) csvUploadStatus.textContent = "";
      csvFileInput.value = ""; // permite volver a elegir el mismo archivo si hace falta
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
