// ===============================
// CONFIGURACIÓN API
// ===============================
// Esta URL debe apuntar SIEMPRE a tu API real (ver README). Desde la API v9 la
// autenticación es por cookie (login explícito con AutenticarLocal),
// ya no por Windows/Negotiate automático — por eso sigue siendo clave
// mandar "credentials: include" en cada fetch, para que esa cookie viaje.
// Reemplaza esto por la URL real de tu API antes de desplegar.
const API = "https://localhost/BitacoraActividades/Api";

// ===============================
// HELPER CENTRAL DE PETICIONES
// ===============================
// Todas las funciones de este archivo pasan por aquí para que el manejo
// de errores, credenciales y JSON sea siempre igual, sin repetir código
// en cada Script*.js.
async function apiFetch(path, { method = "GET", body, isFormData = false } = {}) {
  let response;

  try {
    response = await fetch(`${API}${path}`, {
      method,
      credentials: "include", // obligatorio: así viaja la cookie de sesión
      // Con FormData NO se debe fijar Content-Type a mano: el navegador arma
      // el header correcto solo (multipart/form-data; boundary=...). Si se
      // fija aquí, el backend no puede leer el archivo.
      headers: body && !isFormData ? { "Content-Type": "application/json" } : undefined,
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    // Esto salta cuando el navegador ni siquiera pudo hablar con la API:
    // red no disponible, CORS bloqueado, certificado no confiado, etc.
    const error = new Error(
      "No se pudo contactar la API. Verifica la conexión de red, el certificado y la configuración de CORS."
    );
    error.cause = networkError;
    error.isNetworkError = true;
    throw error;
  }

  // Algunos endpoints devuelven 200 con cuerpo vacío (true/false) o sin cuerpo.
  const rawText = await response.text();
  let data = null;
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText; // por si el backend devuelve texto plano ("No se pudo procesar")
    }
  }

  if (!response.ok) {
    // Se intenta sacar un mensaje legible de las formas de error que ya
    // existen en el backend: RespuestaError { error, mensaje },
    // ValidationProblemDetails { title, errors }, o texto plano.
    let mensaje = `Error ${response.status}`;
    if (data && typeof data === "object") {
      mensaje = data.mensaje || data.title || mensaje;
    } else if (typeof data === "string" && data.trim() !== "") {
      mensaje = data;
    }

    // 401 en cualquier llamada que NO sea el login mismo = la cookie de
    // sesión (dura 12h) ya no es válida. Se manda de vuelta a Login.html
    // en vez de dejar la pantalla con datos a medio cargar. El 401 de
    // AutenticarLocal es distinto (usuario no encontrado en AD), ese lo
    // maneja la propia pantalla de login con su mensaje.
    if (response.status === 401 && path !== "/Usuario/AutenticarLocal") {
      cerrarSesion();
    }

    const error = new Error(mensaje);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

//=========================
// SESIÓN
//=========================
// Desde la API v9 no existe ObtenerUsuarioActual ni un "quién soy" por
// GET: el login es explícito (AutenticarLocal) y lo único que persiste
// del lado del servidor es una cookie. El front tiene que guardar por su
// cuenta los datos del usuario logueado para que el resto de páginas los
// lean sin volver a pedir nada.
const CLAVE_SESION = "usuarioActual";

// request: { usuario: "<nombre de usuario de AD, ej. jperez>" }
// Devuelve { id, correo, nombre } si el usuario existe en AD y
// pertenece a la OU autorizada; si no, tira un error con el mensaje
// exacto que manda el backend (usuario no encontrado / sin acceso).
async function autenticarLocal(usuario) {
  return apiFetch("/Usuario/AutenticarLocal", { method: "POST", body: { usuario } });
}

function guardarUsuarioSesion(usuario) {
  sessionStorage.setItem(CLAVE_SESION, JSON.stringify(usuario));
}

// Lee el usuario logueado desde sessionStorage. Si no hay nada (o el
// contenido está dañado), manda a Login.html y devuelve null.
function requerirSesion() {
  const guardado = sessionStorage.getItem(CLAVE_SESION);
  if (!guardado) {
    irALogin();
    return null;
  }
  try {
    const usuario = JSON.parse(guardado);
    iniciarVigilanciaSesion(usuario.id);
    return usuario;
  } catch {
    sessionStorage.removeItem(CLAVE_SESION);
    irALogin();
    return null;
  }
}

function irALogin() {
  if (location.pathname.endsWith("Login.html")) return; // evita loops
  const volver = encodeURIComponent(location.pathname.split("/").pop());
  location.href = `Login.html?volver=${volver}`;
}

function cerrarSesion() {
  sessionStorage.removeItem(CLAVE_SESION);
  irALogin();
}

// Cada cuánto se revisa si el usuario sigue activo (ver
// iniciarVigilanciaSesion). No hay forma de que el backend avise en
// tiempo real que a alguien lo pasaron a Inactivo mientras está
// conectado — no hay websockets ni nada parecido hoy — así que esto
// es lo más cercano que se puede hacer desde el front: preguntar cada
// cierto tiempo. Puede tardar hasta este intervalo en cerrar la
// sesión después de que un administrador lo desactive.
const INTERVALO_VIGILANCIA_SESION_MS = 60000;
let vigilanciaSesionActiva = false;

function iniciarVigilanciaSesion(idUsuario) {
  if (vigilanciaSesionActiva) return; // no duplicar el intervalo
  vigilanciaSesionActiva = true;

  setInterval(async () => {
    try {
      const usuarios = await obtenerUsuarios();
      const usuarioActual = usuarios.find((u) => u.id === idUsuario);
      const sigueActivo = usuarioActual && normalizarTextoSesion(usuarioActual.estado || "") === "activo";

      if (!sigueActivo) {
        alert("Tu usuario fue desactivado. Se va a cerrar la sesión.");
        cerrarSesion();
      }
    } catch (error) {
      // Un error de red puntual no debe cerrar la sesión de alguien que
      // sigue activo — solo se registra y se reintenta en el próximo ciclo.
      console.error("No se pudo verificar el estado de la sesión:", error);
    }
  }, INTERVALO_VIGILANCIA_SESION_MS);
}

function normalizarTextoSesion(texto) {
  return texto
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " "); // colapsa espacios dobles/múltiples internos a uno solo
}

// Lista completa de usuarios registrados (Maestro de Usuarios y datalist de colaboradores).
async function obtenerUsuarios() {
  return apiFetch("/Usuario/ObtenerUsuarios");
}

// Actualiza los datos de un usuario (pantalla Maestro de Usuarios).
// request: { id, nombre, nombre2, apellido, apellido2, correo, rolId, estadoId, documento }
async function actualizarUsuario(request) {
  return apiFetch("/Usuario/ActualizarUsuario", { method: "PUT", body: request });
}

//=========================
// TICKETS
//=========================

// Lista simple de tickets del usuario autenticado (id, codigo, nombre).
async function obtenerTickets() {
  return apiFetch("/Ticket/ObtenerTickets");
}

// Detalle completo de un ticket (incluye lista de colaboradores).
// Backend v23.0.0: la respuesta ya no trae un solo idAsignacion/
// horasAsignadas para todo el ticket — trae 3 bloques (senior/
// desarrollo/calidad), cada uno { idAsignacion, horas } o null si esa
// categoría no tiene a nadie asignado. Cada colaborador también trae
// su propio idRol e idAsignacion (2=Senior, 3=Desarrollo, 4=Calidad).
async function obtenerDetalleTicket(idTicket) {
  return apiFetch(`/Ticket/ObtenerDetalleTicket/${idTicket}`);
}

// Grilla de tickets para la pantalla de Información de Tickets: sí trae
// Campaña, Descripción y Fecha de Creación reales (a diferencia de
// ObtenerTicketFiltro). Se asume que no recibe parámetro de filtro y
// devuelve todos los tickets; el filtro por estado (Abierto/Resuelto/
// Cerrado/Cancelado) se aplica en el propio front. Si en realidad este
// endpoint sí acepta un filtro server-side, avisa para ajustarlo aquí.
async function consultarTicketsGrilla() {
  return apiFetch("/Ticket/ConsultarTicketsGrilla");
}

// Grilla para la pantalla de Asignación de Tickets: trae exactamente los
// campos que la tabla necesita (incluido Senior, el responsable real del
// ticket). No recibe filtro por parámetro: se trae todo una vez y el
// filtro (radios + búsqueda) se aplica en el propio front.
async function obtenerTicketsAsignacion() {
  return apiFetch("/Ticket/ConsultarTicketsAsignacion");
}

// Sube un CSV de tickets para cargarlos/actualizarlos en bloque.
// El backend espera el archivo en un IFormFile llamado "archivo"
// (parámetro CargarCsv(IFormFile archivo)) y el CSV debe traer las
// columnas number, short_description, opened_at, assigned_to (así las
// lee TicketCsvDto con CsvHelper). Devuelve { ticketsProcesados: <n> }.
// OJO: cada carga CIERRA automáticamente cualquier ticket que no venga
// en el archivo (CerrarTicketsAusentes) — un CSV parcial puede cerrar
// tickets reales que no estén incluidos ahí.
async function cargarTicketsCsv(archivo) {
  const formData = new FormData();
  formData.append("archivo", archivo);
  return apiFetch("/Ticket/CargarCsv", { method: "POST", body: formData, isFormData: true });
}

//=========================
// ASIGNACIÓN
//=========================

// Crea una asignación nueva (ticket "Por Asignar" -> asignado).
// request: { idsUsuarios: [long,...], idTicket, cantidadHoras, idRol }
// Confirmado con el código real (API v21): UNA llamada por categoría —
// idRol identifica cuál (Senior=2, Desarrollo=3, Calidad=4 — IDs
// confirmados en SPR_GET_TICKETS_ASIGNACION). El backend agrupa las
// horas por Ticket+Rol: si ya existe un pool de horas para esa
// combinación, lo reutiliza (cantidadHoras se ignora); si no existe,
// lo crea con cantidadHoras. Agrega los usuarios que no estén
// asignados todavía a ese ticket; no quita a los que ya estaban.
async function asignarTicket(request) {
  return apiFetch("/Asignacion/AsignarTicket", { method: "POST", body: request });
}

// Edita una asignación existente. Mismo request y misma nota de
// arriba sobre idsUsuarios (así está definido hoy en el controller
// EditarTicket).
async function editarAsignacion(request) {
  return apiFetch("/Asignacion/EditarTicket", { method: "PATCH", body: request });
}

//=========================
// AMPLIACIÓN
//=========================

// Agrega horas a una asignación que ya existe (el ticket debe estar
// "Asignado" — no hay forma de ampliar horas de un ticket sin asignar).
// request: { idAsignacion, horasAmpliadas, observacion, idRolEsperado }
// OJO: es idAsignacion, NO idTicket — sale de obtenerDetalleTicket
// (bloque senior/desarrollo/calidad según la categoría elegida).
// idRolEsperado es opcional (backend v23.0.0): si se manda, el backend
// valida que coincida con el rol real de esa asignación antes de
// guardar — capa extra de seguridad, no obligatoria para que funcione.
async function insertarAmpliacion(request) {
  return apiFetch("/Ampliacion/InsertarAmpliacion", { method: "POST", body: request });
}

// Pone la hora de un pool que quedó SIN horas (NULL) — no es para
// modificar horas que ya están puestas: si el pool ya tiene un valor,
// el backend rechaza la petición (400) con el mensaje real del SP
// ("Las horas de este pool ya fueron asignadas. Usa Ampliación para
// modificarlas."), que apiFetch ya deja listo en error.message.
// idAsignacion y cantidadHoras van por query string, no por body (así
// está definido el controller: parámetros simples sin [FromBody]).
async function establecerHorasPrimeraVez(idAsignacion, cantidadHoras) {
  const params = new URLSearchParams({ idAsignacion, cantidadHoras });
  return apiFetch(`/Asignacion/EstablecerHorasPrimeraVez?${params.toString()}`, { method: "PATCH" });
}

//=========================
// TAREA
//=========================
// Tareas creadas desde el widget de escritorio (Api/Tarea/CrearTarea)
// que todavía no están vinculadas a ningún ticket. Devuelve
// ResponseConsultarTareaAdmin[]: { id, codigo, descripcion, campana,
// etapa, horasTrabajadas, senior }.
async function obtenerTareasSinReferencia() {
  return apiFetch("/Tarea/ConsultarTareasSinReferencia");
}

// Vincula una tarea a un ticket. Una vez referenciada, deja de
// aparecer en obtenerTareasSinReferencia.
async function referenciarTarea(idTarea, idTicket) {
  return apiFetch("/Tarea/ReferenciarTarea", {
    method: "PATCH",
    body: { idTarea, idTicket },
  });
}

//=========================
// ROL
//=========================
async function obtenerRoles() {
  return apiFetch("/Rol/ObtenerRoles");
}

//=========================
// ESTADO
//=========================
async function obtenerEstados() {
  return apiFetch("/Estado/ObtenerEstados");
}

//=========================
// BITÁCORA
//=========================
// request: { horasTrabajadas, observacion, idAsignacion }
async function registrarTiempo(request) {
  return apiFetch("/Bitacora/RegistrarTiempo", { method: "POST", body: request });
}

//=========================
// TAREA
//=========================
// Tareas creadas desde la app de escritorio (widget), que todavía no
// están vinculadas a ningún ticket. Response por tarea: { id, codigo,
// descripcion, campana, etapa, horasTrabajadas, senior }.
async function consultarTareasSinReferencia() {
  return apiFetch("/Tarea/ConsultarTareasSinReferencia");
}

// Vincula una tarea a un ticket. Una vez vinculada, deja de aparecer
// en ConsultarTareasSinReferencia.
async function referenciarTarea(idTarea, idTicket) {
  return apiFetch("/Tarea/ReferenciarTarea", { method: "PATCH", body: { idTarea, idTicket } });
}

