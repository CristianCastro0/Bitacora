using Aplicacion.Dtos.Usuario;

namespace Aplicacion.Dtos.Tickets
{
    //Response para mostrar en el frontend el detalle especifico de un ticket
    public class ResponseConsultarDetalleTicket
    {
        public long Id { get; set; }
        public long IdAsignacion { get; set; }
        public string Tipo { get; set; }
        public string Codigo { get; set; }
        public DateTime Fecha { get; set; }
        public string Descripcion { get; set; }
        public decimal HorasAsignadas { get; set; }
        public long IdEtapa { get; set; }
        public string Etapa { get; set; }
        public bool PuedeTrabajar { get; set; }
        public CategoriaDetalleDto? Senior { get; set; }
        public CategoriaDetalleDto? Desarrollo { get; set; }
        public CategoriaDetalleDto? Calidad { get; set; }

        public List<ColaboradorDto> Colaboradores { get; set; }
    }
}