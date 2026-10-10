using Aplicacion.Dtos.Ampliacion;
using Aplicacion.Interfaces.IServicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BitacoraActividades.Controllers
{
    [ApiController]
    [Route("Api/Ampliacion")]
    [Authorize]
    public class AmpliacionController : ControllerBase
    {
        private readonly IAmpliacionServicio ampliacionServicio;
        public AmpliacionController(IAmpliacionServicio ampliacionServicio)
        {
            this.ampliacionServicio = ampliacionServicio;
        }

        [HttpPost("InsertarAmpliacion")]
        public async Task<IActionResult> PostAmpliacion(RequestGestionarAmpliacion request)
        {
            var directorio = User.Identity?.Name;

            if (string.IsNullOrEmpty(directorio))
                return Unauthorized();

            try
            {
                var result = await ampliacionServicio.InsertarAmpliacionAsync(request, directorio);

                if (!result)
                    return BadRequest("No se pudo procesar");

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}