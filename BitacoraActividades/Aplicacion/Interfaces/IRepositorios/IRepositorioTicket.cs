using Aplicacion.Dtos.Tickets;
using Dominio.Modelos;

namespace Aplicacion.Interfaces.IRepositorios
{
    public interface IRepositorioTicket
    {
        Task<IEnumerable<Ticket>> ConsultarTicket(long idUsuario);
        Task<IEnumerable<DetalleTicketDto>> ConsultarDetalleTicket(long id, long idUsuario);
        Task<long> InsertarActualizarTicket(TicketCsvDto ticket, long tipo, string responsable, DateTime fechaSincronizacion);
        Task<IEnumerable<ResponseConsultarTicket>> ConsultarTicketsGrilla();
        Task<IEnumerable<ResponseConsultarTicketsAsignacion>>ConsultarTicketsAsignacion();
        Task CerrarTicketsAusentes(DateTime fechaSincronizacion);

    }
}
