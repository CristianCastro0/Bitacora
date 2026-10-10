using Aplicacion.Dtos.Bitacora;
using Aplicacion.Dtos.Tickets;
using Microsoft.AspNetCore.Http;

namespace Aplicacion.Interfaces.IServicios
{
    public interface ITicketServicio
    {
        Task<IEnumerable<ResponseConsultarTickets>> ConsultarTicketsAsync(long idUsuario);
        Task<ResponseConsultarDetalleTicket> ConsultarDetalleTicketAsync(long id, long idUsuario);
        Task<int> CargarCsvAsync(Stream stream);
        Task<IEnumerable<ResponseConsultarTicket>> ConsultarTicketsGrillaAsync();
        Task<IEnumerable<ResponseConsultarTicketsAsignacion>>ConsultarTicketsAsignacionAsync();

    }
}
