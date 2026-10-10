namespace Aplicacion.Dtos.Tickets
{
    public class ResponseConsultarTicketsAsignacion
    {
        public long IdTicket { get; set; }

        public string CodigoTicket { get; set; }

        public string Senior { get; set; }

        public long EstadoId { get; set; }

        public string Estado { get; set; }

        public DateTime? FechaAsignacion { get; set; }

        public decimal? HorasSenior { get; set; }
        public decimal? HorasCalidad { get; set; }
        public decimal? HorasDesarrollo { get; set; }
    }
}
