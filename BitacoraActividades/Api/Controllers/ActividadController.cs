using Aplicacion.Interfaces.IServicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BitacoraActividades.Controllers
{
    [ApiController]
    [Route("Api/Actividad")]
    [Authorize]
    public class ActividadController : ControllerBase
    {
        private readonly IActividadServicio actividadServicio;

        public ActividadController(IActividadServicio actividadServicio)
        {
            this.actividadServicio = actividadServicio;
        }

        [HttpGet("ObtenerActividades/{idEtapa}")]
        public async Task<ActionResult>ObtenerActividades(long idEtapa)
        {
            var result =await actividadServicio.ConsultarActividadesAsync(idEtapa);

            return Ok(result);
        }
    }
}
