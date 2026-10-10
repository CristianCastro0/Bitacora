using Aplicacion.Dtos.Asignacion;
using Aplicacion.Interfaces;
using Aplicacion.Interfaces.IRepositorios;
using Dapper;
using System.Data;
using System.Threading.Tasks;

namespace Infraestructura.Repositorios
{
    public class RepositorioAsignacion : IRepositorioAsignacion
    {
        private readonly IDBConexion dbconexion;
        public RepositorioAsignacion(IDBConexion DbConexion)
        {
            dbconexion = DbConexion;
        }

        // Actualiza el estado de una asignación asociada a un ticket y usuario
        public async Task<bool> ActualizarAsignacion(RequestActualizarAsignacion request)
        {
            using var conexion = dbconexion.CrearConexion();
            var prm = new DynamicParameters();
            prm.Add("@PI_IDASIGNACION", request.IdAsignacion);
            prm.Add("@PI_IDESTADO", request.IdEstado);

            var result = await conexion.ExecuteAsync(
                "SPR_UPD_ASIGNACION",
                prm,
                commandType: System.Data.CommandType.StoredProcedure
            );
            return result > 0;
        }

        // Inserta una nueva asignación o actualiza una existente según la información enviada
        public async Task<bool> InsertarAsignacion(long idUsuario,long idTicket,decimal? cantidadHoras,long idRol)
        {
            using var conexion = dbconexion.CrearConexion();

            var prm = new DynamicParameters();

            prm.Add("@PI_CANTIDADHORAS", cantidadHoras);
            prm.Add("@PI_IDROL", idRol);
            prm.Add("@PI_USUARIO", idUsuario);
            prm.Add("@PI_IDESTADO", 1);
            prm.Add("@PI_IDTICKET", idTicket);

            var filasAfectadas = await conexion.ExecuteScalarAsync<int>(
                "SPR_INS_ASIGNACION",
                prm,
                commandType: CommandType.StoredProcedure
            );

            return filasAfectadas > 0;
        }

        public async Task<IEnumerable<long>> ObtenerUsuariosAsignados(long idTicket)
        {
            using var conexion = dbconexion.CrearConexion();
            var prm = new DynamicParameters();
            prm.Add("@PI_IDTICKET", idTicket);

            return await conexion.QueryAsync<long>(
                "SPR_GET_USUARIOS_ASIGNADOS",
                prm,
                commandType: System.Data.CommandType.StoredProcedure
            );
        }

        public async Task<bool> ActualizarAsignacionesPorPool(long idAsignacion, long idEstado)
        {
            using var conexion = dbconexion.CrearConexion();
            var prm = new DynamicParameters();
            prm.Add("@PI_IDASIGNACION", idAsignacion);
            prm.Add("@PI_IDESTADO", idEstado);

            var result = await conexion.ExecuteAsync(
                "SPR_UPD_ASIGNACIONES_POR_POOL", prm, commandType: CommandType.StoredProcedure);

            return result > 0;
        }

        public async Task<bool> EstablecerHorasPrimeraVez(long idAsignacion, decimal cantidadHoras)
        {
            using var conexion = dbconexion.CrearConexion();
            var prm = new DynamicParameters();
            prm.Add("@PI_IDASIGNACION", idAsignacion);
            prm.Add("@PI_CANTIDADHORAS", cantidadHoras);

            var result = await conexion.ExecuteAsync(
                "SPR_UPD_HORAS_POOL_PRIMERA_VEZ", prm, commandType: CommandType.StoredProcedure);

            return result > 0;
        }

        public async Task<long?> ObtenerRolPorAsignacion(long idAsignacion)
        {
            using var conexion = dbconexion.CrearConexion();
            var prm = new DynamicParameters();
            prm.Add("@PI_IDASIGNACION", idAsignacion);

            return await conexion.QuerySingleOrDefaultAsync<long?>(
                "SPR_GET_ROL_POR_ASIGNACION", prm, commandType: CommandType.StoredProcedure);
        }
    }
}
