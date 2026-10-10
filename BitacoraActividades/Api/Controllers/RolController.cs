using Aplicacion.Interfaces.IServicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BitacoraActividades.Controllers
{

    [ApiController]
    [Route("Api/Rol")]
    [Authorize]
    public class RolController : ControllerBase
    {
        private readonly IRolServicio rolServicio;

        public RolController(IRolServicio rolServicio)
        {
            this.rolServicio = rolServicio;
        }

        [HttpGet("ObtenerRoles")]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await rolServicio.ConsultarRolesAsync();
            return Ok(roles);
        }
    }
}