using Aplicacion.Dtos.Bitacora;
using Aplicacion.Interfaces;
using Aplicacion.Interfaces.IRepositorios;
using Dapper;

namespace Infraestructura.Repositorios
{
    public class RepositorioBitacora : IRepositorioBitacora
    {
        private readonly IDBConexion dbconexion;
        public RepositorioBitacora(IDBConexion DbConexion)
        {
            dbconexion = DbConexion;
        }

        // Inserta un registro de horas trabajadas en la bitácora asociado a un ticket y usuario
        public async Task<bool> InsertarBitacora(RequestInsertarRegistroBitacora request)
        {
            using var conexion = dbconexion.CrearConexion();
            var prm = new DynamicParameters();
            prm.Add("@PI_FECHA", DateTime.Now);
            prm.Add("@PI_HORAS_TRABAJADAS", request.HorasTrabajadas);
            prm.Add("@PI_OBSERVACION", request.Observacion);
            prm.Add("@PI_IDASIGNACION", request.IdAsignacion);
            prm.Add("@PI_IDACTIVIDAD", request.IdActividad);

            return await conexion.QueryFirstOrDefaultAsync<bool>(
                "SPR_INS_REGISTRO_BITACORA",
                prm,
                commandType: System.Data.CommandType.StoredProcedure
            );
        }

        // Obtiene las horas asignadas a un usuario en un ticket específico
        public async Task<decimal> ConsultarHorasAsignadas(long idAsignacion)
        {
            using var conexion = dbconexion.CrearConexion();
            var prm = new DynamicParameters();
            prm.Add("@PI_IDASIGNACION", idAsignacion);

            return await conexion.QueryFirstOrDefaultAsync<decimal>(
                "SPR_GET_HORAS_ASIGNACION",
                prm,
                commandType: System.Data.CommandType.StoredProcedure
            );
        }

        // Obtiene el total de horas registradas en la bitácora para un ticket y usuario
        public async Task<decimal> ConsultarHorasTrabajadas(long idAsignacion)
        {
            using var conexion = dbconexion.CrearConexion();
            var prm = new DynamicParameters();
            prm.Add("@PI_IDASIGNACION", idAsignacion);

            return await conexion.QueryFirstOrDefaultAsync<decimal>(
                "SPR_GET_HORAS_BITACORA",
                prm,
                commandType: System.Data.CommandType.StoredProcedure
            );
        }

        // Obtiene las horas adicionales (ampliaciones) asociadas a un ticket y usuario
        public async Task<decimal> ConsultarHorasAmpliadas(long idAsignacion)
        {
            using var conexion = dbconexion.CrearConexion();
            var prm = new DynamicParameters();
            prm.Add("@PI_IDASIGNACION", idAsignacion);

            return await conexion.QueryFirstOrDefaultAsync<decimal>(
                "SPR_GET_HORAS_AMPLIACION",
                prm,
                commandType: System.Data.CommandType.StoredProcedure
            );
        }

        public async Task<bool> InsertarBitacoraTarea(RequestRegistrarTiempoTarea request)
        {
            using var conexion = dbconexion.CrearConexion();
            var prm = new DynamicParameters();
            prm.Add("@PI_FECHA", DateTime.Now);
            prm.Add("@PI_HORASTRABAJADAS", request.HorasTrabajadas);
            prm.Add("@PI_OBSERVACION", request.Observacion);
            prm.Add("@PI_IDTAREA", request.IdTarea);

            return await conexion.QueryFirstOrDefaultAsync<bool>(
                "SPR_INS_REGISTRO_BITACORA_TAREA",
                prm,
                commandType: System.Data.CommandType.StoredProcedure
            );
        }

    }
}
