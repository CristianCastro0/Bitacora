namespace Aplicacion.Dtos.Tickets
{
    //DTO para mapear internamente el detalle de un ticket
    public class DetalleTicketDto
    {
        public long Id { get; set; }
        public long IdAsignacion { get; set; }
        public string Tipo { get; set; }
        public string Codigo { get; set; }
        public DateTime Fecha { get; set; }
        public string Descripcion { get; set; }
        public decimal HorasAsignadas { get; set; }
        public long IdRol { get; set; }
        public long IdColaborador { get; set; }
        public string NombreColaborador { get; set; }
        public long IdEtapa { get; set; }
        public string Etapa { get; set; }
        public bool EsUsuarioActual { get; set; }
    }
}
