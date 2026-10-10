using Aplicacion.Dtos.Etapa;
using Aplicacion.Interfaces.IRepositorios;
using Aplicacion.Interfaces;
using System.Data;
using Dapper;

namespace Infraestructura.Repositorios
{
    public class RepositorioEtapa : IRepositorioEtapa
    {
        private readonly IDBConexion dbconexion;
        public RepositorioEtapa(IDBConexion DbConexion)
        {
            dbconexion = DbConexion;
        }

        public async Task<IEnumerable<ResponseConsultarEtapa>> ConsultarEtapas()
        {
            using var conexion = dbconexion.CrearConexion();

            return await conexion.QueryAsync<ResponseConsultarEtapa>(
                "SPR_GET_ETAPAS",
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> ValidarAccesoPorAsignacion(long idAsignacion)
        {
            using var conexion = dbconexion.CrearConexion();
            var prm = new DynamicParameters();
            prm.Add("@PI_IDASIGNACION", idAsignacion);

            return await conexion.QueryFirstAsync<bool>(
                "SPR_VALIDAR_ROL_ETAPA", prm, commandType: CommandType.StoredProcedure);
        }
    }
}
