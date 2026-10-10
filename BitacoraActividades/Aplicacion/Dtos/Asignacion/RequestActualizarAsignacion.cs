using System.ComponentModel.DataAnnotations;

namespace Aplicacion.Dtos.Asignacion
{
    public class RequestActualizarAsignacion
    {
        [Required]
        public long IdEstado { get; set; }
        [Required]
        public long IdAsignacion { get; set; }
    }
}
