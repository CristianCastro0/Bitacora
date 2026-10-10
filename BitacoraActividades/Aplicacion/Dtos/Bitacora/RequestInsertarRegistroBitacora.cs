using System.ComponentModel.DataAnnotations;

namespace Aplicacion.Dtos.Bitacora
{
    // Request para recibir datos desde el frontend para insertar registros en la bitacora
    public class RequestInsertarRegistroBitacora
    {
        [Required]
        [Range(0.01, 24)]
        public decimal HorasTrabajadas { get; set; }

        public string Observacion { get; set; }

        [Required]
        public long IdAsignacion { get; set; }

        [Required]
        public long IdActividad {  get; set; }
    }
}
