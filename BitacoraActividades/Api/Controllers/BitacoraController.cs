using Aplicacion.Dtos.Bitacora;
using Aplicacion.Interfaces.IServicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BitacoraActividades.Controllers
{
    [ApiController]
    [Route("Api/Bitacora")]
    [Authorize]
    public class BitacoraController : ControllerBase
    {
        private readonly IBitacoraServicio bitacoraServicio;

        public BitacoraController(IBitacoraServicio bitacoraServicio)
        {
            this.bitacoraServicio = bitacoraServicio;
        }

        // Endpoint para registrar horas trabajadas en la bitácora,
        // validando el usuario autenticado desde el directorio activo
        [HttpPost("RegistrarTiempo")]
        public async Task<ActionResult> PostRegistroBitacora(RequestInsertarRegistroBitacora request)
        {
            var idUsuarioClaim = User.FindFirst("IdUsuario")?.Value;

            if (!long.TryParse(idUsuarioClaim, out var idUsuario))
                return Unauthorized();

            var result =
                await bitacoraServicio.InsertarRegistroBitacoraAsync(request,idUsuario);

            return Ok(result);
        }

        [HttpGet("ConsultarHorasRestantes/{idAsignacion}")]
        public async Task<ActionResult<ResponseHorasRestantes>> GetHorasRestantes(long idAsignacion)
        {
            var result = await bitacoraServicio.ConsultarHorasRestantesAsync(idAsignacion);
            return Ok(result);
        }

        [HttpPost("RegistrarTiempoTarea")]
        public async Task<ActionResult> PostRegistrarTiempoTarea(RequestRegistrarTiempoTarea request)
        {
            var result = await bitacoraServicio.RegistrarTiempoTareaAsync(request);
            return Ok(result);
        }
    }
}
