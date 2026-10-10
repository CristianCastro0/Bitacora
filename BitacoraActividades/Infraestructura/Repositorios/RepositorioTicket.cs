using Aplicacion.Dtos.Tickets;
using Aplicacion.Interfaces;
using Aplicacion.Interfaces.IRepositorios;
using Dapper;
using Dominio.Modelos;
using System.Data;

namespace Infraestructura.Repositorios
{
    public class RepositorioTicket : IRepositorioTicket
    {
        private readonly IDBConexion dbconexion;
        public RepositorioTicket(IDBConexion DbConexion)
        {
            dbconexion = DbConexion;
        }

        // Obtiene los tickets asociados al usuario autenticado en el sistema
        public async Task<IEnumerable<Ticket>> ConsultarTicket(long idUsuario)
        {
            using var conexion = dbconexion.CrearConexion();
            var prm = new DynamicParameters();
            prm.Add("@PI_IDUSUARIO", idUsuario);

            return await conexion.QueryAsync<Ticket>(
                "SPR_GET_TICKET",
                prm,
                commandType: System.Data.CommandType.StoredProcedure
            );
        }

        // Obtiene el detalle completo de un ticket, incluyendo información y datos relacionados
        public async Task<IEnumerable<DetalleTicketDto>> ConsultarDetalleTicket(long id, long idUsuario)
        {
            using var conexion = dbconexion.CrearConexion();
            var prm = new DynamicParameters();
            prm.Add("@PI_IDTICKET", id);
            prm.Add("@PI_IDUSUARIO",idUsuario);

            return await conexion.QueryAsync<DetalleTicketDto>(
                "SPR_GET_DETALLE_TICKET",
                prm,
                commandType: System.Data.CommandType.StoredProcedure
            );
        }

        // Inserta o actualiza tickets desde un csv en la base
        public async Task<long> InsertarActualizarTicket(TicketCsvDto ticket, long tipo, string responsable, DateTime fechaSincronizacion)
        {
            using var conexion = dbconexion.CrearConexion();

            var prm = new DynamicParameters();

            prm.Add("@PI_CODIGO", ticket.Number);
            prm.Add("@PI_DESCRIPCION", ticket.ShortDescription);
            prm.Add("@PI_FECHA", ticket.OpenedAt);
            prm.Add("@PI_TIPO", tipo);
            prm.Add("@PI_RESPONSABLE", responsable);
            prm.Add("@PI_FECHA_SINCRONIZACION", fechaSincronizacion);

            return await conexion.ExecuteScalarAsync<long>(
                "SPR_IU_TICKETS",
                prm,
                commandType: CommandType.StoredProcedure
            );

        }

        public async Task CerrarTicketsAusentes(DateTime fechaSincronizacion)
        {
            using var conexion = dbconexion.CrearConexion();

            var prm = new DynamicParameters();

            prm.Add("@PI_FECHA_SINCRONIZACION", fechaSincronizacion);

            await conexion.ExecuteAsync(
                "SPR_UPD_CERRAR_TICKETS_AUSENTES",
                prm,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<ResponseConsultarTicket>> ConsultarTicketsGrilla()
        {
            using var conexion = dbconexion.CrearConexion();

            return await conexion.QueryAsync<ResponseConsultarTicket>(
                "SPR_GET_TICKETS_GRILLA",
                commandType: CommandType.StoredProcedure
            );
        }
        public async Task<IEnumerable<ResponseConsultarTicketsAsignacion>>ConsultarTicketsAsignacion()
        {
            using var conexion = dbconexion.CrearConexion();

            return await conexion.QueryAsync<ResponseConsultarTicketsAsignacion>(
                "SPR_GET_TICKETS_ASIGNACION",
                commandType: CommandType.StoredProcedure
            );
        }

    }
}
