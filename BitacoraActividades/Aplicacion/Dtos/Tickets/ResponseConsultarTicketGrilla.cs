namespace Aplicacion.Dtos.Tickets
{
    public class ResponseConsultarTicket
    {
        public long Id { get; set; }

        public string Codigo { get; set; }

        public string Senior { get; set; }

        public string Estado { get; set; }

        public string Descripcion { get; set; }

        public DateTime FechaCreacion { get; set; }
    }
}
