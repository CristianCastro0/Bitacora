using Aplicacion.Dtos.Tarea;
using Aplicacion.Interfaces.IServicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BitacoraActividades.Controllers
{
    [ApiController]
    [Route("Api/Tarea")]
    [Authorize]
    public class TareaController : ControllerBase
    {
        private readonly ITareaServicio tareaServicio;

        public TareaController(ITareaServicio tareaServicio)
        {
            this.tareaServicio = tareaServicio;
        }

        [HttpPost("CrearTarea")]
        public async Task<IActionResult> CrearTarea([FromBody] RequestCrearTarea request)
        {
            var idUsuarioClaim = User.FindFirst("IdUsuario")?.Value;
            if (!long.TryParse(idUsuarioClaim, out var idUsuario))
                return Unauthorized();

            var result = await tareaServicio.CrearTareaAsync(request, idUsuario);
            return Ok(result);
        }

        [HttpGet("ConsultarTareasUsuario")]
        public async Task<IActionResult> ConsultarTareasUsuario()
        {
            var idUsuarioClaim = User.FindFirst("IdUsuario")?.Value;
            if (!long.TryParse(idUsuarioClaim, out var idUsuario))
                return Unauthorized();

            var result = await tareaServicio.ConsultarTareasUsuarioAsync(idUsuario);
            return Ok(result);
        }

        [HttpGet("ConsultarTareasSinReferencia")]
        public async Task<IActionResult> ConsultarTareasSinReferencia()
        {
            var result = await tareaServicio.ConsultarTareasSinReferenciaAsync();
            return Ok(result);
        }

        [HttpPatch("ReferenciarTarea")]
        public async Task<IActionResult> ReferenciarTarea([FromBody] RequestReferenciarTarea request)
        {
            var result = await tareaServicio.ReferenciarTareaAsync(request);
            return Ok(result);
        }
    }
}