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

// IDs de Rol confirmados (mismos que en ScriptAsignacionTicket.js):
// Senior=2, Desarrollo=3, Calidad=4.
const ROL_ID_SENIOR = 2;
const ROL_ID_DESARROLLO = 3;
const ROL_ID_CALIDAD = 4;

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
// atributo a la mitad) y perder datos silenciosamente. Mismo arreglo
// aplicado antes en las otras pantallas.
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
// CARGA DE TICKETS (solo "Asignado" — son los únicos que se pueden ampliar)
//=========================
let ticketsCache = [];

function mostrarMensajeTabla(mensaje) {
  const tbody = document.getElementById("ticketTableBody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">${escaparHtml(mensaje)}</td></tr>`;
}

function crearAccionesCelda(ticket) {
  const td = document.createElement("td");
  td.className = "action-cell";

  const tipo = document.createElement("template");
  const codigoSeguro = escaparHtml(ticket.codigoTicket ?? "");
  const seniorSeguro = escaparHtml(ticket.senior ?? "");
  const horasSeguras = escaparHtml(ticket.horasSenior ?? "");

  // El centrado va en el <div> interno (.action-cell-inner), no en el
  // <td> directamente — poner display:flex en el <td> le rompe el
  // estiramiento normal de la celda cuando otra columna hace la fila
  // más alta (bug real, encontrado y corregido antes en Asignación de
  // Tickets y Maestro de Usuarios).
  tipo.innerHTML = `
    <div class="action-cell-inner">
      <button type="button" class="icon-action-btn ampliar-btn ampliar-trigger"
         data-id-ticket="${ticket.idTicket}"
         data-codigo="${codigoSeguro}"
         data-senior="${seniorSeguro}"
         data-horas="${horasSeguras}"
         title="Ampliar horas">
        <img src="Imagenes/Editar/extender.png" alt="Ampliar horas" class="action-icon" />
      </button>
      <button type="button" class="icon-action-btn editar-hora-btn editar-hora-trigger"
         data-id-ticket="${ticket.idTicket}"
         data-codigo="${codigoSeguro}"
         data-senior="${seniorSeguro}"
         title="Editar hora (primera vez)">
        <img src="Imagenes/Editar/eliminar.png" alt="Editar hora" class="action-icon" />
      </button>
    </div>
  `;
  td.append(...tipo.content.childNodes);
  return td;
}

function renderFilaTicket(ticket) {
  const tr = document.createElement("tr");

  const columnas = [
    ticket.senior ?? "Pendiente",
    ticket.codigoTicket ?? "",
    ticket.estado ?? "",
    ticket.horasSenior ?? "N/D",
    ticket.horasDesarrollo ?? "N/D",
    ticket.horasCalidad ?? "N/D",
  ];

  columnas.forEach((texto) => {
    const td = document.createElement("td");
    td.textContent = texto;
    tr.appendChild(td);
  });

  tr.appendChild(crearAccionesCelda(ticket));
  return tr;
}

async function cargarTickets() {
  mostrarMensajeTabla("Cargando tickets...");
  try {
    const todos = await obtenerTicketsAsignacion();
    // Solo los que ya están "Asignado": son los únicos con horas
    // programadas, y por lo tanto los únicos a los que se les puede
    // ampliar horas (no existe una API para asignar y ampliar en el
    // mismo paso).
    ticketsCache = (todos || []).filter(
      (t) => normalizarTexto(t.estado || "") === normalizarTexto("Asignado")
    );

    const tbody = document.getElementById("ticketTableBody");
    tbody.innerHTML = "";

    if (ticketsCache.length === 0) {
      mostrarMensajeTabla("No hay tickets asignados todavía.");
      return;
    }

    ticketsCache.forEach((ticket) => tbody.appendChild(renderFilaTicket(ticket)));
    filtrarTabla();
  } catch (error) {
    console.error("Error obteniendo tickets:", error);
    mostrarMensajeTabla(`No se pudieron cargar los tickets: ${error.message}`);
  }
}

cargarTickets();

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

  const tableRows = Array.from(document.querySelectorAll("#ticketTableBody tr"));
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
// MODAL AMPLIAR HORAS
//=========================
const ampliarModal = document.getElementById("ampliarModal");
const ampliarModalCodigo = document.getElementById("ampliarModalCodigo");
const ampliarModalSenior = document.getElementById("ampliarModalSenior");
const ampliarModalHorasActuales = document.getElementById("ampliarModalHorasActuales");
const ampliarModalHoras = document.getElementById("ampliarModalHoras");
const ampliarModalObservacion = document.getElementById("ampliarModalObservacion");
const saveAmpliarBtn = document.getElementById("saveAmpliarBtn");
const categoriaAmpliacionInputs = document.querySelectorAll('input[name="categoriaAmpliacion"]');

let ticketEnAmpliacion = null; // { idTicket, detalle }

function abrirAmpliarModal() {
  ampliarModal.classList.add("show");
}
function cerrarAmpliarModal() {
  ampliarModal.classList.remove("show");
  ticketEnAmpliacion = null;
  ampliarModalHoras.value = "";
  ampliarModalObservacion.value = "";
  categoriaAmpliacionInputs.forEach((input) => (input.checked = false));
  ampliarModalHoras.disabled = true;
  ampliarModalObservacion.disabled = true;
}

// Horas y Observación quedan deshabilitados hasta que se elige una
// categoría (Senior/Desarrollo/Calidad).
categoriaAmpliacionInputs.forEach((input) => {
  input.addEventListener("change", () => {
    ampliarModalHoras.disabled = false;
    ampliarModalObservacion.disabled = false;
  });
});

//=========================
// MODAL EDITAR HORA (EstablecerHorasPrimeraVez)
//=========================
const editarHoraModal = document.getElementById("editarHoraModal");
const editarHoraModalCodigo = document.getElementById("editarHoraModalCodigo");
const editarHoraModalSenior = document.getElementById("editarHoraModalSenior");
const editarHoraModalHoras = document.getElementById("editarHoraModalHoras");
const saveEditarHoraBtn = document.getElementById("saveEditarHoraBtn");
const categoriaEditarHoraInputs = document.querySelectorAll('input[name="categoriaEditarHora"]');

let ticketEnEdicionHora = null; // { idTicket, detalle }

function abrirEditarHoraModal() {
  editarHoraModal.classList.add("show");
}
function cerrarEditarHoraModal() {
  editarHoraModal.classList.remove("show");
  ticketEnEdicionHora = null;
  editarHoraModalHoras.value = "";
  editarHoraModalHoras.disabled = true;
  categoriaEditarHoraInputs.forEach((input) => (input.checked = false));
}

categoriaEditarHoraInputs.forEach((input) => {
  input.addEventListener("change", () => {
    editarHoraModalHoras.disabled = false;
  });
});

document.getElementById("closeEditarHoraModalBtn").addEventListener("click", cerrarEditarHoraModal);
document.getElementById("cancelEditarHoraBtn").addEventListener("click", cerrarEditarHoraModal);
editarHoraModal.addEventListener("click", (e) => {
  if (e.target === editarHoraModal) cerrarEditarHoraModal();
});

saveEditarHoraBtn.addEventListener("click", async () => {
  if (!ticketEnEdicionHora) return;

  const categoriaSeleccionada = document.querySelector('input[name="categoriaEditarHora"]:checked');
  if (!categoriaSeleccionada) {
    alert("Elige a cuál categoría le vas a poner la hora.");
    return;
  }

  const horas = Number(editarHoraModalHoras.value);
  if (!editarHoraModalHoras.value || !(horas > 0)) {
    alert("Las horas deben ser un número mayor a 0.");
    return;
  }

  if (!ticketEnEdicionHora.detalle) {
    alert("Todavía se está cargando la información de este ticket — espera un momento e intenta de nuevo.");
    return;
  }

  // Backend v23.0.0: se resuelve el idAsignacion exacto de la
  // categoría elegida (antes esto no se podía saber con certeza si el
  // ticket tenía más de una categoría asignada).
  const bloquePorCategoria = {
    Senior: ticketEnEdicionHora.detalle.senior,
    Desarrollo: ticketEnEdicionHora.detalle.desarrollo,
    Calidad: ticketEnEdicionHora.detalle.calidad,
  };
  const bloque = bloquePorCategoria[categoriaSeleccionada.value];

  if (!bloque) {
    alert(
      `Todavía no hay nadie asignado a "${categoriaSeleccionada.value}" en este ticket — primero hay que ` +
        "asignar a alguien (desde Asignación de Tickets) antes de poder ponerle horas."
    );
    return;
  }

  saveEditarHoraBtn.disabled = true;
  try {
    await establecerHorasPrimeraVez(bloque.idAsignacion, horas);
    alert("Hora guardada correctamente");
    cerrarEditarHoraModal();
    cargarTickets();
  } catch (error) {
    console.error("Error estableciendo la hora:", error);
    // Si el pool ya tenía horas, error.message ya trae el aviso real
    // del backend ("...Usa Ampliación para modificarlas.").
    alert(`No se pudo guardar: ${error.message}`);
  } finally {
    saveEditarHoraBtn.disabled = false;
  }
});

document.getElementById("ticketTableBody").addEventListener("click", async (e) => {
  const ampliarTrigger = e.target.closest(".ampliar-trigger");
  const editarHoraTrigger = e.target.closest(".editar-hora-trigger");

  if (editarHoraTrigger) {
    const idTicket = Number(editarHoraTrigger.dataset.idTicket);
    ticketEnEdicionHora = { idTicket, detalle: null };

    editarHoraModalCodigo.value = editarHoraTrigger.dataset.codigo || "";
    editarHoraModalSenior.value = editarHoraTrigger.dataset.senior || "";

    abrirEditarHoraModal();

    // Backend v23.0.0: mismo detalle completo que usa Ampliar, para
    // poder resolver el idAsignacion exacto según la categoría elegida.
    try {
      const detalle = await obtenerDetalleTicket(idTicket);
      if (!ticketEnEdicionHora || ticketEnEdicionHora.idTicket !== idTicket) return; // se cerró mientras cargaba
      ticketEnEdicionHora.detalle = detalle;
    } catch (error) {
      console.error("No se pudo cargar el detalle del ticket:", error);
      alert("No se pudo cargar la información de este ticket. Cierra el modal e intenta de nuevo.");
    }
    return;
  }

  if (ampliarTrigger) {
    const idTicket = Number(ampliarTrigger.dataset.idTicket);
    ticketEnAmpliacion = { idTicket, detalle: null };

    ampliarModalCodigo.value = ampliarTrigger.dataset.codigo || "";
    ampliarModalSenior.value = ampliarTrigger.dataset.senior || "";
    ampliarModalHorasActuales.value = ampliarTrigger.dataset.horas || "";

    abrirAmpliarModal();

    // Backend v23.0.0: el detalle trae senior/desarrollo/calidad por
    // separado, cada uno con su propio idAsignacion — se guarda
    // completo para poder resolver el correcto según la categoría que
    // se elija en el selector.
    try {
      const detalle = await obtenerDetalleTicket(idTicket);
      if (!ticketEnAmpliacion || ticketEnAmpliacion.idTicket !== idTicket) return; // se cerró el modal mientras cargaba
      ticketEnAmpliacion.detalle = detalle;
    } catch (error) {
      console.error("No se pudo cargar el detalle del ticket:", error);
      alert("No se pudo cargar la información de la asignación de este ticket. Cierra el modal e intenta de nuevo.");
    }
  }
});

document.getElementById("closeAmpliarModalBtn").addEventListener("click", cerrarAmpliarModal);
document.getElementById("cancelAmpliarBtn").addEventListener("click", cerrarAmpliarModal);
ampliarModal.addEventListener("click", (e) => {
  if (e.target === ampliarModal) cerrarAmpliarModal();
});

saveAmpliarBtn.addEventListener("click", async () => {
  if (!ticketEnAmpliacion) return;

  if (!ticketEnAmpliacion.detalle) {
    alert("Todavía se está cargando la información de este ticket — espera un momento e intenta de nuevo.");
    return;
  }

  const categoriaSeleccionada = document.querySelector('input[name="categoriaAmpliacion"]:checked');
  if (!categoriaSeleccionada) {
    alert("Elige a qué categoría va la ampliación (Senior, Desarrollo o Calidad).");
    return;
  }

  const horas = Number(ampliarModalHoras.value);
  if (!ampliarModalHoras.value || !(horas > 0)) {
    alert("Las horas a ampliar deben ser un número mayor a 0.");
    return;
  }

  const observacion = ampliarModalObservacion.value.trim();
  if (!observacion) {
    alert("La observación no puede quedar vacía.");
    return;
  }

  // Backend v23.0.0: el idAsignacion correcto según la categoría
  // elegida ya viene en el detalle (senior/desarrollo/calidad, cada
  // uno con el suyo) — idAsignacion identifica el pool por sí solo,
  // no hace falta ningún campo de categoría en el request para que
  // funcione.
  const mapaCategorias = {
    Senior: { bloque: ticketEnAmpliacion.detalle.senior, idRol: ROL_ID_SENIOR },
    Desarrollo: { bloque: ticketEnAmpliacion.detalle.desarrollo, idRol: ROL_ID_DESARROLLO },
    Calidad: { bloque: ticketEnAmpliacion.detalle.calidad, idRol: ROL_ID_CALIDAD },
  };
  const categoria = mapaCategorias[categoriaSeleccionada.value];

  if (!categoria.bloque) {
    alert(`Este ticket todavía no tiene a nadie en "${categoriaSeleccionada.value}" — no hay ninguna hora que ampliar ahí.`);
    return;
  }

  saveAmpliarBtn.disabled = true;
  try {
    await insertarAmpliacion({
      idAsignacion: categoria.bloque.idAsignacion,
      horasAmpliadas: horas,
      observacion,
      // Opcional (backend v23.0.0): capa extra de validación — si el
      // idAsignacion resuelto no coincide de verdad con este rol, el
      // backend rechaza en vez de guardar en el pool equivocado.
      idRolEsperado: categoria.idRol,
    });

    alert("Ampliación guardada correctamente");
    cerrarAmpliarModal();
    cargarTickets();
  } catch (error) {
    console.error("Error guardando la ampliación:", error);
    alert(`No se pudo guardar la ampliación: ${error.message}`);
  } finally {
    saveAmpliarBtn.disabled = false;
  }
});
