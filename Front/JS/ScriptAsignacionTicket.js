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

// ===============================
// ESTADO DEL MÓDULO
// ===============================
// Mapa "nombre en minúsculas" -> usuario { id, correo, nombre, estado },
// se llena con la respuesta real de /Usuario/ObtenerUsuarios y se usa para
// convertir el nombre que se escribe en el input "Senior" al id numérico
// que pide la API (idUsuario).
// IDs de Rol confirmados en el comentario de SPR_GET_TICKETS_ASIGNACION
// ("excluye Senior (2), solo Desarrollo/Calidad" + los JOIN por ROL_NID
// 2/3/4). Si en algún momento cambian del lado de la base de datos,
// hay que actualizarlos aquí también.
const ROL_ID_SENIOR = 2;
const ROL_ID_DESARROLLO = 3;
const ROL_ID_CALIDAD = 4;

let usuariosPorNombre = new Map();
let ticketsCache = []

// Guarda a qué ticket corresponde el modal abierto actualmente, porque las
// filas se re-dibujan con datos reales y no podemos confiar solo en lo que
// quedó escrito en los inputs de solo lectura del modal.
let ticketEnEdicion = null; // { idTicket, idAsignacionSenior, idAsignacionDesarrollo, idAsignacionCalidad }
let ticketEnAsignacion = null; // { idTicket }

function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " "); // colapsa espacios dobles/múltiples internos a uno solo
}

// Escapa texto antes de meterlo en un innerHTML. Sin esto, un nombre o
// descripción con comillas puede romper el HTML generado (corta el
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

// La API (ResponseConsultarTicketFiltro) todavía no manda el campo "Tipo"
// del ticket. Mientras el backend no lo agregue, lo inferimos del prefijo
// del código (convención típica de ServiceNow: RITM = Requerimiento,
// INC = Incidente). Si el detalle real del ticket sí trae Tipo, ese dato
// manda y reemplaza este cálculo (ver cargarDetalleEnModalEditar).
function inferirTipoPorCodigo(codigo) {
  if (!codigo) return "N/D";
  if (codigo.startsWith("RITM")) return "Requerimiento";
  if (codigo.startsWith("INC")) return "Incidente";
  return "N/D";
}

function formatearFecha(fechaIso) {
  if (!fechaIso) return "Pendiente";
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return "Pendiente";
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${fecha.getFullYear()}`;
}

// ===============================
// CARGA DE USUARIOS (datalist de colaboradores)
// ===============================
let usuariosDesarrolloPorNombre = new Map();
let usuariosCalidadPorNombre = new Map();

async function cargarUsuarios() {
  const usuariosMaestroList = document.getElementById("usuariosMaestroList");
  const usuariosDesarrolloList = document.getElementById("usuariosDesarrolloList");
  const usuariosCalidadList = document.getElementById("usuariosCalidadList");
  if (!usuariosMaestroList) return;

  try {
    const usuarios = await obtenerUsuarios();
    usuariosPorNombre = new Map();
    usuariosDesarrolloPorNombre = new Map();
    usuariosCalidadPorNombre = new Map();
    usuariosMaestroList.innerHTML = "";
    if (usuariosDesarrolloList) usuariosDesarrolloList.innerHTML = "";
    if (usuariosCalidadList) usuariosCalidadList.innerHTML = "";

    const usuariosFiltrados = usuarios.filter(
      (usuario) => normalizarTexto(usuario.estado || "") === normalizarTexto("Activo")
    );

    // Diagnóstico: reportado que alguien aparece en la lista de
    // Desarrollo sin tener ese Rol en el Maestro de Usuarios. El
    // filtro de abajo compara el Rol exacto (normalizado) contra
    // "Desarrollador" — si esto sigue pasando, revisar en la consola
    // qué Rol trae exactamente esa persona desde la API.
    console.log(
      "[Diagnóstico] Usuarios activos cargados (nombre → rol):",
      usuariosFiltrados.map((u) => `${u.nombre} → "${u.rol}"`)
    );

    usuariosFiltrados.forEach((usuario) => {
        usuariosPorNombre.set(normalizarTexto(usuario.nombre || ""), usuario);

        const option = document.createElement("option");
        option.value = usuario.nombre;
        option.label = usuario.correo || "";
        usuariosMaestroList.appendChild(option);

        // Colaboradores de Asignar se filtran por Rol: la lista de
        // "Desarrolladores" ve gente con Rol = Desarrollador (así está
        // nombrado el rol — las horas se siguen llamando "Desarrollo",
        // pero el rol de la persona no), y lo mismo para Calidad.
        const rolNormalizado = normalizarTexto(usuario.rol || "");
        if (rolNormalizado === normalizarTexto("Desarrollador") && usuariosDesarrolloList) {
          usuariosDesarrolloPorNombre.set(normalizarTexto(usuario.nombre || ""), usuario);
          const opcionDev = document.createElement("option");
          opcionDev.value = usuario.nombre;
          opcionDev.label = usuario.correo || "";
          usuariosDesarrolloList.appendChild(opcionDev);
        } else if (rolNormalizado === normalizarTexto("Calidad") && usuariosCalidadList) {
          usuariosCalidadPorNombre.set(normalizarTexto(usuario.nombre || ""), usuario);
          const opcionQA = document.createElement("option");
          opcionQA.value = usuario.nombre;
          opcionQA.label = usuario.correo || "";
          usuariosCalidadList.appendChild(opcionQA);
        }
      });
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
  }
}

// ===============================
// CARGA Y RENDER DE TICKETS
// ===============================
function crearAccionesCelda(ticket, esAsignado) {
  const td = document.createElement("td");
  td.className = "action-cell";
 
  const tipo = document.createElement("template");
  const claseTrigger = esAsignado ? "edit-trigger" : "assign-trigger";
  const claseBtn = esAsignado ? "edit-btn" : "assign-btn";
  const texto = esAsignado ? "Editar" : "Asignar";
  const icono = esAsignado ? "Imagenes/Editar/editar.png" : "Imagenes/Editar/Asignar.png";
  const seniorSeguro = escaparHtml(ticket.senior ?? "");
  const codigoSeguro = escaparHtml(ticket.codigoTicket ?? "");
  const tipoSeguro = escaparHtml(inferirTipoPorCodigo(ticket.codigoTicket));
  const horasSeguras = escaparHtml(ticket.horasSenior ?? "");
  // Se pasan las 3 horas actuales (si ya existen) para que, al abrir
  // "Asignar" de nuevo sobre un ticket que YA tiene alguna categoría
  // asignada, el modal pueda bloquear esa hora en vez de dejar que se
  // escriba un valor que se perdería en silencio (ver nota en
  // manejarClickAsignar: InsertarAsignacionAsync devuelve éxito sin
  // hacer nada si todos los usuarios de esa llamada ya estaban
  // asignados — esto es especialmente seguro con Senior, que es una
  // sola persona fija).
  const horasSeniorSeguras = escaparHtml(ticket.horasSenior ?? "");
  const horasDesarrolloSeguras = escaparHtml(ticket.horasDesarrollo ?? "");
  const horasCalidadSeguras = escaparHtml(ticket.horasCalidad ?? "");

  // Solo el botón de ícono (antes también había un texto "Editar"/
  // "Asignar" al lado, redundante con el ícono — se quitó porque mezclar
  // texto con un botón de borde grueso hacía que el margen se viera
  // desigual a la vista, aunque matemáticamente estaba centrado.
  //
  // El centrado va en un <div> interno (.action-cell-inner), NO
  // directamente en el <td>: poner display:flex en el <td> le rompe el
  // comportamiento normal de estirarse para igualar la altura de la
  // fila (bug real, confirmado: con la columna Desarrollo mostrando
  // varios nombres la fila se hace más alta, pero el <td> con flex
  // directo se queda con su altura mínima y el ícono queda pegado
  // arriba en vez de centrado). Con el div interno + height:100%, el
  // <td> vuelve a comportarse como celda normal y sí se estira con la
  // fila, y el ícono queda centrado en la altura real.
  tipo.innerHTML = `
    <div class="action-cell-inner">
      <button type="button" class="icon-action-btn ${claseBtn} ${claseTrigger}"
         data-id-ticket="${ticket.idTicket}"
         data-senior="${seniorSeguro}"
         data-codigo="${codigoSeguro}"
         data-tipo="${tipoSeguro}"
         data-horas="${horasSeguras}"
         data-horas-senior="${horasSeniorSeguras}"
         data-horas-desarrollo="${horasDesarrolloSeguras}"
         data-horas-calidad="${horasCalidadSeguras}">
        <img src="${icono}" alt="${texto}" class="action-icon" />
      </button>
    </div>
  `;
  td.append(...tipo.content.childNodes);
  return td;
}
 
function renderFilaTicket(ticket) {
  // El botón ya no depende de Estado (Asignado/Por Asignar) — depende
  // de si las 3 categorías (Senior, Desarrollo, Calidad) ya tienen
  // horas puestas. Si falta cualquiera de las 3, sigue siendo
  // "Asignar" (el modal de Asignar ya deja de solo lectura la que ya
  // esté puesta, y editable la que falte). Solo cuando las 3 están
  // completas pasa a "Editar" (que solo agrega más gente a
  // Desarrollo/Calidad, sin tocar horas).
  const esAsignado = ticket.horasSenior != null && ticket.horasDesarrollo != null && ticket.horasCalidad != null;
  const tr = document.createElement("tr");
 
  const columnas = [
    ticket.senior ?? "Pendiente",
    ticket.codigoTicket ?? "",
    ticket.estado ?? "",
    formatearFecha(ticket.fechaAsignacion),
    ticket.horasSenior ?? "N/D",
    ticket.horasDesarrollo ?? "N/D",
    ticket.horasCalidad ?? "N/D",
  ];
 
  columnas.forEach((texto) => {
    const td = document.createElement("td");
    td.textContent = texto;
    tr.appendChild(td);
  });

  // Columna "Desarrollo": el listado no trae los nombres de los
  // colaboradores, solo el detalle de cada ticket por separado
  // (GET /Ticket/ObtenerDetalleTicket/{id}). Se pinta "Cargando..." y
  // cargarDesarrolladoresDeTickets() la llena después, en paralelo
  // para todos los tickets, sin bloquear el resto de la tabla.
  const tdDesarrollo = document.createElement("td");
  tdDesarrollo.className = "desarrollo-cell";
  tdDesarrollo.dataset.idTicket = ticket.idTicket;
  tdDesarrollo.textContent = desarrolladoresPorTicket[ticket.idTicket] ?? "Cargando...";
  tr.appendChild(tdDesarrollo);
 
  tr.appendChild(crearAccionesCelda(ticket, esAsignado));
  return tr;
}

// Cache idTicket -> texto ya resuelto de la columna "Desarrollo". Se
// reinicia en cada cargarTickets() para no mostrar datos viejos si
// justo se editaron los colaboradores de un ticket. "Exportar a
// Excel" lee de aquí mismo.
let desarrolladoresPorTicket = {};

// Pide el detalle de cada ticket EN PARALELO (Promise.allSettled, no uno
// por uno) para no volver lenta la pantalla si hay varios tickets. Si
// ObtenerDetalleTicket falla para algún ticket puntual, esa celda queda
// en "N/D" en vez de romper el resto de la tabla.
async function cargarDesarrolladoresDeTickets(tickets) {
  await Promise.allSettled(
    tickets.map(async (ticket) => {
      try {
        const detalle = await obtenerDetalleTicket(ticket.idTicket);
        // Solo Rol=Desarrollo — antes se mostraban TODOS los
        // colaboradores del ticket (incluido el Senior), bug real
        // confirmado: quedó así de cuando solo existía una lista
        // genérica de colaboradores, antes de separar por categoría.
        const desarrolladores = (detalle.colaboradores || []).filter((c) => c.idRol === ROL_ID_DESARROLLO);
        const nombres =
          desarrolladores.length > 0 ? desarrolladores.map((c) => c.nombreColaborador).join(", ") : "Sin desarrolladores";
        desarrolladoresPorTicket[ticket.idTicket] = nombres;
      } catch (error) {
        console.error(`No se pudo cargar desarrolladores del ticket ${ticket.idTicket}:`, error);
        desarrolladoresPorTicket[ticket.idTicket] = "N/D";
      }

      const celda = document.querySelector(`.desarrollo-cell[data-id-ticket="${ticket.idTicket}"]`);
      if (celda) celda.textContent = desarrolladoresPorTicket[ticket.idTicket];
    })
  );
}

function mostrarMensajeTabla(mensaje) {
  const tbody = document.getElementById("ticketTableBody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">${escaparHtml(mensaje)}</td></tr>`;
}

async function cargarTickets() {
  mostrarMensajeTabla("Cargando tickets...");
  try {
    ticketsCache = await obtenerTicketsAsignacion();
    desarrolladoresPorTicket = {}; // se descarta el cache de la carga anterior
    const tbody = document.getElementById("ticketTableBody");
    tbody.innerHTML = "";
 
    if (!ticketsCache || ticketsCache.length === 0) {
      mostrarMensajeTabla("No hay tickets para mostrar.");
      return;
    }
 
    ticketsCache.forEach((ticket) => tbody.appendChild(renderFilaTicket(ticket)));
    filtrarTabla();
    cargarDesarrolladoresDeTickets(ticketsCache); // en paralelo, no bloquea el resto de la tabla
  } catch (error) {
    console.error("Error obteniendo tickets:", error);
    mostrarMensajeTabla(`No se pudieron cargar los tickets: ${error.message}`);
  }
}

// ===============================
// EXPORTAR A EXCEL
// ===============================
// Se exporta como CSV (no un .xlsx real): Excel abre un .csv
// directamente sin pasos extra, y así no hace falta cargar ninguna
// librería externa (SheetJS, etc.) que dependa de internet — la API
// puede estar en una red interna sin salida a internet, así que más
// vale no arriesgarse a que un CDN externo no cargue ahí.
function escaparCsv(valor) {
  const texto = String(valor ?? "");
  if (/[",\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

function exportarTicketsExcel() {
  if (!ticketsCache || ticketsCache.length === 0) {
    alert("No hay tickets cargados para exportar.");
    return;
  }

  const encabezados = [
    "Senior",
    "Codigo Ticket",
    "Estado",
    "Fecha Asignacion",
    "Horas Senior",
    "Horas Desarrollo",
    "Horas Calidad",
    "Desarrollo",
  ];
  const filas = ticketsCache.map((ticket) => [
    ticket.senior ?? "Pendiente",
    ticket.codigoTicket ?? "",
    ticket.estado ?? "",
    formatearFecha(ticket.fechaAsignacion),
    ticket.horasSenior ?? "N/D",
    ticket.horasDesarrollo ?? "N/D",
    ticket.horasCalidad ?? "N/D",
    // Si se exporta antes de que termine de cargar la columna en pantalla,
    // puede salir "Cargando..." para algún ticket puntual.
    desarrolladoresPorTicket[ticket.idTicket] ?? "Cargando...",
  ]);

  const lineasCsv = [encabezados, ...filas].map((fila) => fila.map(escaparCsv).join(","));
  // El \uFEFF (BOM) al inicio es para que Excel detecte UTF-8 solo y no
  // rompa acentos/ñ al abrir el archivo.
  const contenidoCsv = "\uFEFF" + lineasCsv.join("\r\n");

  const blob = new Blob([contenidoCsv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  const fecha = new Date().toISOString().slice(0, 10);
  enlace.href = url;
  enlace.download = `tickets_asignacion_${fecha}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

const exportarExcelBtn = document.getElementById("exportarExcelBtn");
if (exportarExcelBtn) {
  exportarExcelBtn.addEventListener("click", exportarTicketsExcel);
}

// ===============================
// FILTRO TABLA (búsqueda + radios) + PAGINACIÓN
// ===============================
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

  // Se vuelve a consultar el DOM en cada llamada porque las filas se
  // reemplazan por completo cada vez que se recarga desde la API.
  const tableRows = Array.from(document.querySelectorAll("#ticketTableBody tr"));
  const filasDeDatos = tableRows.filter((row) => row.children.length >= 3);

  const filasQueCoinciden = filasDeDatos.filter((row) => {
    const textoFila = normalizarTexto(row.textContent);
    const estadoFila = normalizarTexto(row.children[2].textContent);
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

// ===============================
// MODAL EDITAR TICKET
// ===============================
const editModal = document.getElementById("editTicketModal");
const closeEditModalBtn = document.getElementById("closeEditModalBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveEditBtn = document.getElementById("saveEditBtn");

const addEditDesarrolloBtn = document.getElementById("addEditDesarrolloBtn");
const editDesarrolloInput = document.getElementById("modalDesarrolloInput");
const editDesarrolloList = document.getElementById("editDesarrolloList");

const addEditCalidadBtn = document.getElementById("addEditCalidadBtn");
const editCalidadInput = document.getElementById("modalCalidadInput");
const editCalidadList = document.getElementById("editCalidadList");

const modalNombre = document.getElementById("modalNombre");
const modalCodigo = document.getElementById("modalCodigo");
const modalTipo = document.getElementById("modalTipo");
const modalHorasSenior = document.getElementById("modalHorasSenior");
const modalHorasDesarrollo = document.getElementById("modalHorasDesarrollo");
const modalHorasCalidad = document.getElementById("modalHorasCalidad");

function abrirEditModal() {
  if (editModal) editModal.classList.add("show");
}

function cerrarEditModal() {
  if (editModal) editModal.classList.remove("show");
  ticketEnEdicion = null;
}

function limpiarColaboradoresEdit() {
  if (editDesarrolloList) editDesarrolloList.innerHTML = "";
  if (editCalidadList) editCalidadList.innerHTML = "";
}

// Marca un chip como "ya existía" (precargado desde el detalle real),
// para no volver a mandarlo al guardar — solo se mandan los nuevos
// que se agreguen en esta sesión del modal (el backend de todas formas
// filtra a quien ya esté asignado, pero así se evitan llamadas de más
// cuando no se agregó a nadie nuevo en una categoría).
function crearChipColaboradorExistente(usuario, listaEl) {
  if (!listaEl) return;
  const chip = document.createElement("div");
  chip.className = "collaborator-chip";
  chip.dataset.idUsuario = usuario.id;
  chip.dataset.existente = "true";
  chip.innerHTML = `
    <div class="collaborator-chip-badge"></div>
    <span class="collaborator-chip-text">${escaparHtml(usuario.nombre)}</span>
    <button type="button" class="collaborator-chip-remove">×</button>
  `;
  chip.querySelector(".collaborator-chip-remove").addEventListener("click", () => chip.remove());
  listaEl.appendChild(chip);
}

// Al abrir "Editar" ya se muestran los datos que trae la fila (rápido),
// y en paralelo se pide el detalle real del ticket (backend v23.0.0:
// trae senior/desarrollo/calidad por separado, y cada colaborador con
// su propio idRol e idAsignacion) para precargar todo con precisión.
async function cargarDetalleEnModalEditar(idTicket) {
  try {
    const detalle = await obtenerDetalleTicket(idTicket);
    if (!detalle || !ticketEnEdicion || ticketEnEdicion.idTicket !== idTicket) return;

    if (modalTipo) modalTipo.value = detalle.tipo || modalTipo.value;

    ticketEnEdicion.idAsignacionSenior = detalle.senior?.idAsignacion ?? null;
    ticketEnEdicion.idAsignacionDesarrollo = detalle.desarrollo?.idAsignacion ?? null;
    ticketEnEdicion.idAsignacionCalidad = detalle.calidad?.idAsignacion ?? null;

    if (modalHorasSenior) modalHorasSenior.value = detalle.senior?.horas ?? "";
    if (modalHorasDesarrollo) modalHorasDesarrollo.value = detalle.desarrollo?.horas ?? "";
    if (modalHorasCalidad) modalHorasCalidad.value = detalle.calidad?.horas ?? "";

    limpiarColaboradoresEdit();

    (detalle.colaboradores || []).forEach((c) => {
      const usuario = { id: c.idColaborador, nombre: c.nombreColaborador };
      if (c.idRol === ROL_ID_DESARROLLO) crearChipColaboradorExistente(usuario, editDesarrolloList);
      else if (c.idRol === ROL_ID_CALIDAD) crearChipColaboradorExistente(usuario, editCalidadList);
      // Al Senior no se le agrega chip aquí: en Editar no se le puede
      // agregar más gente (es una sola persona fija, definida al Asignar).
    });
  } catch (error) {
    console.error("No se pudo cargar el detalle del ticket:", error);
  }
}

function manejarClickEditar(trigger) {
  const idTicket = Number(trigger.dataset.idTicket);
  const senior = trigger.dataset.senior || "";
  const codigo = trigger.dataset.codigo || "";
  const tipo = trigger.dataset.tipo || "";

  ticketEnEdicion = { idTicket, idAsignacionSenior: null, idAsignacionDesarrollo: null, idAsignacionCalidad: null };

  if (modalNombre) modalNombre.value = senior;
  if (modalCodigo) modalCodigo.value = codigo;
  if (modalTipo) modalTipo.value = tipo;
  if (modalHorasSenior) modalHorasSenior.value = trigger.dataset.horasSenior || "";
  if (modalHorasDesarrollo) modalHorasDesarrollo.value = trigger.dataset.horasDesarrollo || "";
  if (modalHorasCalidad) modalHorasCalidad.value = trigger.dataset.horasCalidad || "";

  limpiarColaboradoresEdit();
  abrirEditModal();
  cargarDetalleEnModalEditar(idTicket);
}

if (closeEditModalBtn) closeEditModalBtn.addEventListener("click", cerrarEditModal);
if (cancelEditBtn) cancelEditBtn.addEventListener("click", cerrarEditModal);

if (editModal) {
  editModal.addEventListener("click", (e) => {
    if (e.target === editModal) cerrarEditModal();
  });
}

if (addEditDesarrolloBtn) {
  addEditDesarrolloBtn.addEventListener("click", () => {
    if (!editDesarrolloInput) return;
    const usuario = usuariosDesarrolloPorNombre.get(normalizarTexto(editDesarrolloInput.value.trim()));
    if (!usuario) {
      alert("Selecciona a alguien de la lista (debe existir en el Maestro de Usuarios con Rol = Desarrollador).");
      return;
    }
    crearChipColaboradorTipo(usuario, editDesarrolloList);
    editDesarrolloInput.value = "";
  });
}

if (editDesarrolloInput) {
  editDesarrolloInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (addEditDesarrolloBtn) addEditDesarrolloBtn.click();
    }
  });
}

if (addEditCalidadBtn) {
  addEditCalidadBtn.addEventListener("click", () => {
    if (!editCalidadInput) return;
    const usuario = usuariosCalidadPorNombre.get(normalizarTexto(editCalidadInput.value.trim()));
    if (!usuario) {
      alert("Selecciona a alguien de la lista (debe existir en el Maestro de Usuarios con Rol = Calidad).");
      return;
    }
    crearChipColaboradorTipo(usuario, editCalidadList);
    editCalidadInput.value = "";
  });
}

if (editCalidadInput) {
  editCalidadInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (addEditCalidadBtn) addEditCalidadBtn.click();
    }
  });
}

if (saveEditBtn) {
  saveEditBtn.addEventListener("click", async () => {
    if (!ticketEnEdicion) return;

    // Solo se mandan los chips agregados en esta sesión (sin
    // data-existente) — los que ya estaban no hace falta reenviarlos.
    const nuevosDesarrollo = Array.from(editDesarrolloList?.children ?? [])
      .filter((c) => c.dataset.existente !== "true")
      .map((c) => Number(c.dataset.idUsuario));
    const nuevosCalidad = Array.from(editCalidadList?.children ?? [])
      .filter((c) => c.dataset.existente !== "true")
      .map((c) => Number(c.dataset.idUsuario));

    if (nuevosDesarrollo.length === 0 && nuevosCalidad.length === 0) {
      alert("Agrega al menos una persona nueva a Desarrollo o Calidad antes de guardar.");
      return;
    }

    saveEditBtn.disabled = true;
    try {
      // Las horas que se mandan aquí no importan de verdad: el backend
      // solo las usa si la categoría no tenía pool todavía (no debería
      // pasar en Editar, ya que solo se agrega a categorías que ya
      // existen) — si ya existe, las ignora y usa las que ya tenía.
      if (nuevosDesarrollo.length > 0) {
        await editarAsignacion({
          idsUsuarios: nuevosDesarrollo,
          idTicket: ticketEnEdicion.idTicket,
          cantidadHoras: Number(modalHorasDesarrollo.value) || 1,
          idRol: ROL_ID_DESARROLLO,
        });
      }

      if (nuevosCalidad.length > 0) {
        await editarAsignacion({
          idsUsuarios: nuevosCalidad,
          idTicket: ticketEnEdicion.idTicket,
          cantidadHoras: Number(modalHorasCalidad.value) || 1,
          idRol: ROL_ID_CALIDAD,
        });
      }

      alert("Cambios guardados correctamente");
      cerrarEditModal();
      cargarTickets();
    } catch (error) {
      console.error("Error guardando cambios:", error);
      alert(`No se pudo guardar: ${error.message}`);
    } finally {
      saveEditBtn.disabled = false;
    }
  });
}

// ===============================
// MODAL ASIGNAR TICKET
// ===============================
const assignModal = document.getElementById("assignTicketModal");
const closeAssignModalBtn = document.getElementById("closeAssignModalBtn");
const cancelAssignBtn = document.getElementById("cancelAssignBtn");
const saveAssignBtn = document.getElementById("saveAssignBtn");

const addAssignDesarrolloBtn = document.getElementById("addAssignDesarrolloBtn");
const assignDesarrolloInput = document.getElementById("assignModalDesarrolloInput");
const assignDesarrolloList = document.getElementById("assignDesarrolloList");

const addAssignCalidadBtn = document.getElementById("addAssignCalidadBtn");
const assignCalidadInput = document.getElementById("assignModalCalidadInput");
const assignCalidadList = document.getElementById("assignCalidadList");

const assignModalCodigo = document.getElementById("assignModalCodigo");
const assignModalTipo = document.getElementById("assignModalTipo");
const assignModalNombre = document.getElementById("assignModalNombre");
const assignModalHorasSenior = document.getElementById("assignModalHorasSenior");
const assignModalHorasDesarrollo = document.getElementById("assignModalHorasDesarrollo");
const assignModalHorasCalidad = document.getElementById("assignModalHorasCalidad");

function abrirAssignModal() {
  if (assignModal) assignModal.classList.add("show");
}

function cerrarAssignModal() {
  if (assignModal) assignModal.classList.remove("show");
  ticketEnAsignacion = null;
}

function limpiarColaboradoresAssign() {
  if (assignDesarrolloList) assignDesarrolloList.innerHTML = "";
  if (assignCalidadList) assignCalidadList.innerHTML = "";
}

// Un solo creador de chip para ambas listas — recibe a cuál lista
// agregar y qué campo de horas habilitar cuando se agregue el primero.
function crearChipColaboradorTipo(usuario, listaEl) {
  if (!listaEl) return;
  if ([...listaEl.children].some((c) => Number(c.dataset.idUsuario) === usuario.id)) return;

  const chip = document.createElement("div");
  chip.className = "collaborator-chip";
  chip.dataset.idUsuario = usuario.id;
  chip.innerHTML = `
    <div class="collaborator-chip-badge"></div>
    <span class="collaborator-chip-text">${escaparHtml(usuario.nombre)}</span>
    <button type="button" class="collaborator-chip-remove">×</button>
  `;
  chip.querySelector(".collaborator-chip-remove").addEventListener("click", () => chip.remove());
  listaEl.appendChild(chip);
}

function manejarClickAsignar(trigger) {
  const idTicket = Number(trigger.dataset.idTicket);
  const senior = trigger.dataset.senior || "";
  const codigo = trigger.dataset.codigo || "";
  const tipo = trigger.dataset.tipo || "";

  // Si una categoría YA tiene horas, reabrir "Asignar" sobre ella no
  // sirve para corregirlas: InsertarAsignacionAsync filtra a quien ya
  // esté asignado (ObtenerUsuariosAsignados) y, si no queda nadie
  // nuevo en esa llamada, no hace nada y aun así devuelve éxito — la
  // hora que se escriba se perdería en silencio. Por eso, si ya hay
  // valor, el campo queda de solo lectura (mostrando lo que ya tiene)
  // en vez de dejar escribir algo que no se va a guardar. Corregir
  // horas ya puestas necesita el endpoint EstablecerHorasPrimeraVez
  // (hoy sin conectar a ningún lado) u otro camino que se defina.
  const horasSeniorExistente = trigger.dataset.horasSenior || "";
  const horasDesarrolloExistente = trigger.dataset.horasDesarrollo || "";
  const horasCalidadExistente = trigger.dataset.horasCalidad || "";

  ticketEnAsignacion = {
    idTicket,
    senior,
    seniorYaAsignado: horasSeniorExistente !== "",
    desarrolloYaAsignado: horasDesarrolloExistente !== "",
    calidadYaAsignado: horasCalidadExistente !== "",
    idAsignacionSenior: null, // se completa abajo, si ya existe (ver cargarDetalleParaAsignarSenior)
  };

  if (assignModalCodigo) assignModalCodigo.value = codigo;
  if (assignModalTipo) assignModalTipo.value = tipo;
  if (assignModalNombre) assignModalNombre.value = senior;

  if (assignModalHorasSenior) {
    if (ticketEnAsignacion.seniorYaAsignado) {
      assignModalHorasSenior.readOnly = true;
      assignModalHorasSenior.disabled = false;
      assignModalHorasSenior.value = horasSeniorExistente;
      assignModalHorasSenior.title = "El Senior ya tiene horas asignadas — hoy no hay forma de corregirlas desde aquí.";
    } else {
      assignModalHorasSenior.readOnly = false;
      assignModalHorasSenior.disabled = false;
      assignModalHorasSenior.value = "";
      assignModalHorasSenior.title = "";
    }
  }

  if (assignModalHorasDesarrollo) {
    if (ticketEnAsignacion.desarrolloYaAsignado) {
      assignModalHorasDesarrollo.readOnly = true;
      assignModalHorasDesarrollo.disabled = false;
      assignModalHorasDesarrollo.value = horasDesarrolloExistente;
      assignModalHorasDesarrollo.title =
        "Desarrollo ya tiene horas asignadas — se pueden agregar más desarrolladores, pero no cambiar esta hora desde aquí.";
    } else {
      assignModalHorasDesarrollo.readOnly = false;
      assignModalHorasDesarrollo.disabled = false;
      assignModalHorasDesarrollo.value = "";
      assignModalHorasDesarrollo.title = "";
    }
  }

  if (assignModalHorasCalidad) {
    if (ticketEnAsignacion.calidadYaAsignado) {
      assignModalHorasCalidad.readOnly = true;
      assignModalHorasCalidad.disabled = false;
      assignModalHorasCalidad.value = horasCalidadExistente;
      assignModalHorasCalidad.title =
        "Calidad ya tiene horas asignadas — se pueden agregar más personas, pero no cambiar esta hora desde aquí.";
    } else {
      assignModalHorasCalidad.readOnly = false;
      assignModalHorasCalidad.disabled = false;
      assignModalHorasCalidad.value = "";
      assignModalHorasCalidad.title = "";
    }
  }

  limpiarColaboradoresAssign();
  abrirAssignModal();

  // Si el Senior todavía no tiene horas, puede que YA exista su fila
  // en TBL_TASIGNACION (creada automáticamente al cargar el CSV, sin
  // horas) — en ese caso, AsignarTicket no serviría (el backend la ve
  // como "ya asignado" y no hace nada), hay que usar
  // EstablecerHorasPrimeraVez con su idAsignacion real. Se busca aquí.
  if (!ticketEnAsignacion.seniorYaAsignado) {
    cargarIdAsignacionSenior(idTicket);
  }
}

// Busca si el Senior ya tiene una fila de asignación (aunque esté sin
// horas) para poder usar EstablecerHorasPrimeraVez al guardar, en vez
// de AsignarTicket (que la ignoraría por completo — ver nota arriba).
async function cargarIdAsignacionSenior(idTicket) {
  try {
    const detalle = await obtenerDetalleTicket(idTicket);
    if (!ticketEnAsignacion || ticketEnAsignacion.idTicket !== idTicket) return; // se cerró mientras cargaba
    ticketEnAsignacion.idAsignacionSenior = detalle?.senior?.idAsignacion ?? null;
  } catch (error) {
    console.error("No se pudo revisar si el Senior ya tenía una fila de asignación:", error);
    // No es bloqueante: si falla, se sigue intentando por el camino
    // normal (AsignarTicket) al guardar.
  }
}

if (closeAssignModalBtn) closeAssignModalBtn.addEventListener("click", cerrarAssignModal);
if (cancelAssignBtn) cancelAssignBtn.addEventListener("click", cerrarAssignModal);

if (assignModal) {
  assignModal.addEventListener("click", (e) => {
    if (e.target === assignModal) cerrarAssignModal();
  });
}

if (addAssignDesarrolloBtn) {
  addAssignDesarrolloBtn.addEventListener("click", () => {
    if (!assignDesarrolloInput) return;
    const usuario = usuariosDesarrolloPorNombre.get(normalizarTexto(assignDesarrolloInput.value.trim()));
    if (!usuario) {
      alert("Selecciona a alguien de la lista (debe existir en el Maestro de Usuarios con Rol = Desarrollador).");
      return;
    }
    crearChipColaboradorTipo(usuario, assignDesarrolloList);
    assignDesarrolloInput.value = "";
  });
}

if (assignDesarrolloInput) {
  assignDesarrolloInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (addAssignDesarrolloBtn) addAssignDesarrolloBtn.click();
    }
  });
}

if (addAssignCalidadBtn) {
  addAssignCalidadBtn.addEventListener("click", () => {
    if (!assignCalidadInput) return;
    const usuario = usuariosCalidadPorNombre.get(normalizarTexto(assignCalidadInput.value.trim()));
    if (!usuario) {
      alert("Selecciona a alguien de la lista (debe existir en el Maestro de Usuarios con Rol = Calidad).");
      return;
    }
    crearChipColaboradorTipo(usuario, assignCalidadList);
    assignCalidadInput.value = "";
  });
}

if (assignCalidadInput) {
  assignCalidadInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (addAssignCalidadBtn) addAssignCalidadBtn.click();
    }
  });
}

if (saveAssignBtn) {
  saveAssignBtn.addEventListener("click", async () => {
    if (!ticketEnAsignacion) return;

    const idsUsuariosDesarrollo = Array.from(assignDesarrolloList?.children ?? []).map((c) =>
      Number(c.dataset.idUsuario)
    );
    const idsUsuariosCalidad = Array.from(assignCalidadList?.children ?? []).map((c) => Number(c.dataset.idUsuario));

    const horasSenior = assignModalHorasSenior && assignModalHorasSenior.value !== "" ? Number(assignModalHorasSenior.value) : null;
    if (!horasSenior || horasSenior <= 0) {
      alert("Las horas del Senior son obligatorias y deben ser mayores a 0.");
      return;
    }

    let horasDesarrollo = null;
    if (idsUsuariosDesarrollo.length > 0) {
      horasDesarrollo = assignModalHorasDesarrollo.value !== "" ? Number(assignModalHorasDesarrollo.value) : null;
      if (!horasDesarrollo || horasDesarrollo <= 0) {
        alert("Agregaste desarrolladores — las Horas Desarrollo son obligatorias y deben ser mayores a 0.");
        return;
      }
    } else if (assignModalHorasDesarrollo.value !== "" && Number(assignModalHorasDesarrollo.value) > 0) {
      // Caso inverso: escribió una hora pero no agregó a nadie. Antes
      // esto se guardaba en silencio (esa hora simplemente no se
      // mandaba) y el mensaje de éxito genérico daba a entender que
      // sí se había guardado — se avisa aquí, dando la oportunidad de
      // agregar al desarrollador antes de perder ese dato.
      const seguir = confirm(
        `Escribiste ${assignModalHorasDesarrollo.value} horas para Desarrollo, pero no agregaste a ningún ` +
          "desarrollador — esa hora NO se va a guardar.\n\n¿Continuar de todas formas (sin Desarrollo), o cancelar " +
          "para agregar primero a alguien?"
      );
      if (!seguir) return;
    }

    let horasCalidad = null;
    if (idsUsuariosCalidad.length > 0) {
      horasCalidad = assignModalHorasCalidad.value !== "" ? Number(assignModalHorasCalidad.value) : null;
      if (!horasCalidad || horasCalidad <= 0) {
        alert("Agregaste personas de Calidad — las Horas Calidad son obligatorias y deben ser mayores a 0.");
        return;
      }
    } else if (assignModalHorasCalidad.value !== "" && Number(assignModalHorasCalidad.value) > 0) {
      const seguir = confirm(
        `Escribiste ${assignModalHorasCalidad.value} horas para Calidad, pero no agregaste a nadie de calidad — ` +
          "esa hora NO se va a guardar.\n\n¿Continuar de todas formas (sin Calidad), o cancelar para agregar " +
          "primero a alguien?"
      );
      if (!seguir) return;
    }

    // El Senior ya viene precargado desde el ticket (TIC_CRESPONSABLE,
    // llega por el CSV). Si ya existe su fila de asignación (creada
    // automáticamente al cargar el CSV, sin horas), se completa por
    // EstablecerHorasPrimeraVez — AsignarTicket no serviría ahí, el
    // backend lo vería como "ya asignado" y no haría nada. Solo si NO
    // existe esa fila todavía hace falta resolver el usuario por
    // nombre y usar AsignarTicket para crearla desde cero.
    let usuarioSenior = null;
    if (!ticketEnAsignacion.seniorYaAsignado && !ticketEnAsignacion.idAsignacionSenior) {
      usuarioSenior = usuariosPorNombre.get(normalizarTexto(ticketEnAsignacion.senior || ""));
      if (!usuarioSenior) {
        // Antes de rendirse, busca si hay alguien cuyo nombre se PAREZCA
        // (uno contiene al otro) — para distinguir "no está registrado"
        // de "está registrado pero con el nombre escrito distinto" (ej.
        // con o sin segundo apellido entre el ticket y el Maestro de
        // Usuarios), que son problemas distintos de arreglar.
        const buscado = normalizarTexto(ticketEnAsignacion.senior || "");
        const parecidos = Array.from(usuariosPorNombre.values()).filter((u) => {
          const nombreNormalizado = normalizarTexto(u.nombre || "");
          return nombreNormalizado.includes(buscado) || buscado.includes(nombreNormalizado);
        });

        console.error(
          "Senior no encontrado. Buscado:", JSON.stringify(ticketEnAsignacion.senior),
          "| Parecidos en el Maestro de Usuarios:", parecidos.map((u) => u.nombre)
        );

        if (parecidos.length > 0) {
          alert(
            `No se encontró exactamente a "${ticketEnAsignacion.senior}" en el Maestro de Usuarios, pero sí algo ` +
              `parecido: "${parecidos[0].nombre}". Es probable que el nombre esté escrito distinto entre el ticket ` +
              "y el Maestro de Usuarios (con o sin segundo nombre/apellido) — hay que revisar y ajustar."
          );
        } else {
          alert(
            `No se encontró en el Maestro de Usuarios a "${ticketEnAsignacion.senior}" — no se le pueden asignar horas ` +
              "de Senior sin que esa persona esté registrada ahí."
          );
        }
        return;
      }
    }

    saveAssignBtn.disabled = true;
    try {
      // Una llamada por categoría (así lo pide la API: idRol identifica
      // cuál). Se hacen en secuencia, no en paralelo, para poder decir
      // con precisión cuál falló si alguna da error.
      //
      // Si el Senior YA tenía horas asignadas, no se llama a nada para
      // él: como es una sola persona fija, ya está completo.
      if (!ticketEnAsignacion.seniorYaAsignado) {
        if (ticketEnAsignacion.idAsignacionSenior) {
          // Ya existía su fila (creada al cargar el CSV) — se completa
          // la hora ahí directamente, sin pasar por AsignarTicket.
          await establecerHorasPrimeraVez(ticketEnAsignacion.idAsignacionSenior, horasSenior);
        } else {
          // No existía ninguna fila todavía — se crea desde cero.
          await asignarTicket({
            idsUsuarios: [usuarioSenior.id],
            idTicket: ticketEnAsignacion.idTicket,
            cantidadHoras: horasSenior,
            idRol: ROL_ID_SENIOR,
          });
        }
      }

      if (idsUsuariosDesarrollo.length > 0) {
        await asignarTicket({
          idsUsuarios: idsUsuariosDesarrollo,
          idTicket: ticketEnAsignacion.idTicket,
          cantidadHoras: horasDesarrollo,
          idRol: ROL_ID_DESARROLLO,
        });
      }

      if (idsUsuariosCalidad.length > 0) {
        await asignarTicket({
          idsUsuarios: idsUsuariosCalidad,
          idTicket: ticketEnAsignacion.idTicket,
          cantidadHoras: horasCalidad,
          idRol: ROL_ID_CALIDAD,
        });
      }

      alert("Ticket asignado correctamente");
      cerrarAssignModal();
      cargarTickets();
    } catch (error) {
      console.error("Error asignando ticket:", error);
      alert(
        "No se pudo completar la asignación (puede que Senior sí se haya guardado y Desarrollo/Calidad no, según " +
          `en qué paso falló): ${error.message}`
      );
    } finally {
      saveAssignBtn.disabled = false;
    }
  });
}

// ===============================
// DELEGACIÓN DE EVENTOS PARA LOS BOTONES DE LA TABLA
// ===============================
// Un solo listener en el tbody, porque las filas se reemplazan por
// completo en cada carga y los triggers de antes (edit-trigger /
// assign-trigger) dejarían de existir si se enlazaran uno por uno.
document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("ticketTableBody");
  if (!tbody) return;

  tbody.addEventListener("click", (e) => {
    const editTrigger = e.target.closest(".edit-trigger");
    const assignTrigger = e.target.closest(".assign-trigger");

    if (editTrigger) {
      e.preventDefault();
      manejarClickEditar(editTrigger);
    } else if (assignTrigger) {
      e.preventDefault();
      manejarClickAsignar(assignTrigger);
    }
  });

  cargarUsuarios();
  cargarTickets();
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
