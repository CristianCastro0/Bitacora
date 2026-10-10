using Aplicacion.Dtos.Asignacion;
using Aplicacion.Interfaces.IServicios;
using Infraestructura.Repositorios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BitacoraActividades.Controllers
{
    [ApiController]
    [Route("Api/Asignacion")]
    [Authorize]
    public class AsignacionController : ControllerBase
    {
        private readonly IAsignacionServicio asignacionServicio;

        public AsignacionController(IAsignacionServicio asignacionServicio)
        {
            this.asignacionServicio = asignacionServicio;

        }

        // Endpoint para asignar un ticket a un usuario mediante la creación de una nueva asignación
        [HttpPost("AsignarTicket")]
        public async Task<ActionResult> PostAsignacion(RequestInsertarAsignacion request)
        {

            var result = await asignacionServicio.InsertarAsignacionAsync(request);

            if (!result)
                return BadRequest("No se pudo procesar");

            return Ok(result);

        }

        // Endpoint para actualizar el estado de una asignación existente de un ticket
        [HttpPatch("EditarTicket")]
        public async Task<ActionResult> PatchAsignacion(RequestInsertarAsignacion request)
        {

            var result = await asignacionServicio.InsertarAsignacionAsync(request);

            if (!result)
                return BadRequest("No se pudo procesar");

            return Ok(result);

        }

        [HttpPatch("EstablecerHorasPrimeraVez")]
        public async Task<IActionResult> PatchHorasPrimeraVez(long idAsignacion, decimal cantidadHoras)
        {
            try
            {
                var result = await asignacionServicio.EstablecerHorasPrimeraVezAsync(idAsignacion, cantidadHoras);
                if (!result) return BadRequest("No se pudo procesar");
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message); 
            }
        }
    }
}
