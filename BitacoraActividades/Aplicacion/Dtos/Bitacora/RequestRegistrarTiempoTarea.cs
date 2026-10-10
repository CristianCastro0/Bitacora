using System.ComponentModel.DataAnnotations;

namespace Aplicacion.Dtos.Bitacora
{
    public class RequestRegistrarTiempoTarea
    {
        [Required]
        [Range(0.01, 24)]
        public decimal HorasTrabajadas { get; set; }
        public string Observacion { get; set; }
        [Required]
        public long IdTarea { get; set; }
    }
}
