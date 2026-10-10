using System.ComponentModel.DataAnnotations;

namespace Aplicacion.Dtos.Usuario
{
    public class RequestGIUsuario
    {
        [Required]
        public string Directorio { get; set; }
        public string Correo { get; set; }

        [Required]
        public string Nombre1 { get; set; }

        public string? Nombre2 { get; set; }

        [Required]
        public string Apellido1 { get; set; }
        public string? Apellido2 { get; set; }
    }
}
