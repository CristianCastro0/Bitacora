using System.ComponentModel.DataAnnotations;

namespace Aplicacion.Dtos.Asignacion
{
    public class RequestInsertarAsignacion
    {
        [Required]
        [MinLength(1, ErrorMessage = "Debes seleccionar al menos un colaborador")]
        public List<long> IdsUsuarios { get; set; }

        public long IdTicket { get; set; }

        [Range(0.05, 9999, ErrorMessage = "Las horas asignadas deben ser mayores a 0.05")]
        public decimal CantidadHoras { get; set; }
        public long IdRol {  get; set; }

    }
}
