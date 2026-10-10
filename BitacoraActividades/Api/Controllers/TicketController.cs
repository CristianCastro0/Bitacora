using Aplicacion.Dtos.Tickets;
using Aplicacion.Interfaces.IServicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


namespace BitacoraActividades.Controllers
{
    [ApiController]
    [Route("Api/Ticket")]
    [Authorize]
    public class TicketController : ControllerBase
    {
        private readonly ITicketServicio ticketServicio;

        public TicketController(ITicketServicio ticketServicio)
        {
            this.ticketServicio = ticketServicio;
        }


        // Endpoint para obtener los tickets asociados al usuario autenticado
        [HttpGet("ObtenerTickets")]
        public async Task<ActionResult<IEnumerable<ResponseConsultarTickets>>> GetTickets()
        {
            var idUsuarioClaim = User.FindFirst("IdUsuario")?.Value;

            if (!long.TryParse(idUsuarioClaim, out var idUsuario))
                return Unauthorized();

            var result = await ticketServicio.ConsultarTicketsAsync(idUsuario);

            if (result == null)
                return NotFound(result);
            return Ok(result);
            

        }

        // Endpoint para obtener el detalle completo de un ticket por su identificador
        [HttpGet("ObtenerDetalleTicket/{id}")]
        public async Task<ActionResult<ResponseConsultarDetalleTicket>> GetDetalleTickets(long id)
        {
            var idUsuarioClaim = User.FindFirst("IdUsuario")?.Value;

            if (!long.TryParse(idUsuarioClaim, out var idUsuario))
                return Unauthorized();

            var result = await ticketServicio.ConsultarDetalleTicketAsync(id, idUsuario);

            if (result == null)
                return NotFound(result);
            return Ok(result);
        
        }

        [HttpPost("CargarCsv")]
        public async Task<IActionResult> CargarCsv(IFormFile archivo)
        {
            using var stream = archivo.OpenReadStream();

            var cantidad = await ticketServicio.CargarCsvAsync(stream);

            return Ok(new
            {
                TicketsProcesados = cantidad
            });
        }

        [HttpGet("ConsultarTicketsGrilla")]
        public async Task<IActionResult> GetTicketsGrilla()
        {
            var result = await ticketServicio.ConsultarTicketsGrillaAsync();

            return Ok(result);
        }

        [HttpGet("ConsultarTicketsAsignacion")]
        public async Task<IActionResult> GetTicketsAsignacion()
        {
            var result = await ticketServicio.ConsultarTicketsAsignacionAsync();

            return Ok(result);
        }

    }

}
