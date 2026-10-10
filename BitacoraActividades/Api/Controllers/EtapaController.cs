using Aplicacion.Interfaces.IServicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BitacoraActividades.Controllers
{
    [ApiController]
    [Route("Api/Etapa")]
    [Authorize]
    public class EtapaController : ControllerBase
    {
        private readonly IEtapaServicio etapaServicio;

        public EtapaController(IEtapaServicio etapaServicio)
        {
            this.etapaServicio = etapaServicio;
        }

        [HttpGet("ObtenerEtapas")]
        public async Task<ActionResult>ObtenerEtapas()
        {
            var result =
                await etapaServicio.ConsultarEtapasAsync();

            return Ok(result);
        }
    }
}
