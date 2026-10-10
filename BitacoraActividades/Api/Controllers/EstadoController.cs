using Aplicacion.Interfaces.IServicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BitacoraActividades.Controllers
{

    [ApiController]
    [Route("Api/Estado")]
    [Authorize]
    public class EstadoController : ControllerBase
    {
        private readonly IEstadoServicio estadoServicio;

        public EstadoController(IEstadoServicio estadoServicio)
        {
            this.estadoServicio = estadoServicio;
        }

        [HttpGet("ObtenerEstados")]
        public async Task<IActionResult> GetEstados()
        {
            var result = await estadoServicio.ConsultarEstadosAsync();
            return Ok(result);
        }
    }
}