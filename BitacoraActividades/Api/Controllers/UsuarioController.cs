using Aplicacion.Dtos.Usuario;
using Aplicacion.Interfaces.IRepositorios;
using Aplicacion.Interfaces.IServicios;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.DirectoryServices.AccountManagement;
using System.Security.Claims;


namespace BitacoraActividades.Controllers
{
    [ApiController]
    [Route("Api/Usuario")]
    public class UsuarioController : ControllerBase
    {
        private readonly IUsuarioServicio usuarioServicio;              
        private readonly IActiveDirectorySoapServicio adSoapServicio;   
        private readonly IRepositorioUsuario repositorioUsuario;
        private const string DominioNetbios = "TUEMPRESA";


        public UsuarioController(
            IUsuarioServicio usuarioServicio,
            IActiveDirectorySoapServicio adSoapServicio,
            IRepositorioUsuario repositorioUsuario)
        {
            this.usuarioServicio = usuarioServicio;
            this.adSoapServicio = adSoapServicio;
            this.repositorioUsuario = repositorioUsuario;
        }

        [HttpPost("AutenticarLocal")]
        [AllowAnonymous]
        public async Task<IActionResult> AutenticarLocal([FromBody] RequestAutenticarLocal request)
        {

            if (string.IsNullOrWhiteSpace(request?.Usuario))
                return BadRequest("Falta el usuario.");

            var datosAD = await adSoapServicio.BuscarUsuarioAsync(request.Usuario.Trim());

            if (datosAD == null)
                return Unauthorized("Usuario no encontrado en Active Directory.");

            if (!(datosAD.DistinguishedName ?? "").Contains("OU=Tecnologia", StringComparison.OrdinalIgnoreCase))
                return StatusCode(403, "No tienes acceso a esta herramienta.");

            var partesNombre = (datosAD.Nombre ?? "").Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var nombre1 = partesNombre.ElementAtOrDefault(0) ?? "";
            var nombre2 = partesNombre.ElementAtOrDefault(1);

            var partesApellido = (datosAD.Apellido ?? "").Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var apellido1 = partesApellido.ElementAtOrDefault(0) ?? "";
            var apellido2 = partesApellido.ElementAtOrDefault(1);


            var usuarioAd = new UsuarioAdDto
            {
                Directorio = $@"{DominioNetbios}\{datosAD.SamAccountName}",
                Correo = string.IsNullOrWhiteSpace(datosAD.Mail) ? "sin-correo" : datosAD.Mail,
                Nombre1 = nombre1,
                Nombre2 = nombre2,
                Apellido1 = apellido1,
                Apellido2 = apellido2
            };

            var usuarioBd = await usuarioServicio.ConsultarInsertarUsuarioAsync(usuarioAd);

            var claims = new List<Claim>
            {
            new Claim(ClaimTypes.Name, datosAD.SamAccountName),
            new Claim(ClaimTypes.Email, usuarioBd.Correo ?? " "),
            new Claim("DistinguishedName", datosAD.DistinguishedName),
            new Claim("IdUsuario", usuarioBd.Id.ToString()),
            new Claim("Rol", usuarioBd.Rol ?? ""),
            };

            var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var principal = new ClaimsPrincipal(identity);

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                principal,
                new AuthenticationProperties { IsPersistent = true, ExpiresUtc = DateTimeOffset.UtcNow.AddHours(12) }
            );

            return Ok(new
            {
                id = usuarioBd.Id,
                correo = usuarioBd.Correo,
                rol = usuarioBd.Rol,
                nombre = $"{datosAD.Nombre} {datosAD.Apellido}"
            });
        }

        // Endpoint para obtener la lista de todos los usuarios registrados en el sistema
        [Authorize]
        [HttpGet("ObtenerUsuarios")]
        public async Task<ActionResult<IEnumerable<ResponseConsultarUsuario>>> GetUsuarios()
        {
            var result = await usuarioServicio.ConsultarUsuariosAsync();
            return Ok(result);
        }

        // Endpoint para actualizar la información de un usuario
        [Authorize]
        [HttpPut("ActualizarUsuario")]
        public async Task<IActionResult> PutUsuario(RequestActualizarUsuario request)
        {
            var result = await usuarioServicio.ActualizarUsuarioAsync(request);

            if (!result) 
                return BadRequest("No se pudo procesar");

            return Ok(result);

        }

}
}

