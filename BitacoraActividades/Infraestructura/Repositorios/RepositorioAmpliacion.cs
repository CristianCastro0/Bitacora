using Aplicacion.Dtos.Ampliacion;
using Aplicacion.Interfaces;
using Aplicacion.Interfaces.IRepositorios;
using Dapper;

namespace Infraestructura.Repositorios
{
    public class RepositorioAmpliacion : IRepositorioAmpliacion
    {
        private readonly IDBConexion dbconexion;
        public RepositorioAmpliacion(IDBConexion DbConexion)
        {
            dbconexion = DbConexion;
        }
        public async Task<bool> InsertarAmpliacion(RequestGestionarAmpliacion request)
        {
            using var conexion = dbconexion.CrearConexion();
            var prm = new DynamicParameters();
            prm.Add("@PI_HORAS_AMPLIADAS", request.HorasAmpliadas);
            prm.Add("@PI_OBSERVACION", request.Observacion);
            prm.Add("@PI_IDASIGNACION", request.IdAsignacion);

            var result = await conexion.ExecuteAsync(
                "SPR_IU_AMPLIACION",
                prm,
                commandType: System.Data.CommandType.StoredProcedure
            );

            return result > 0;
        }

    }
}
