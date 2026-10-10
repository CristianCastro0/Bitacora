using Aplicacion.Dtos.Actividad;
using Aplicacion.Dtos.Etapa;
using Aplicacion.Interfaces;
using Aplicacion.Interfaces.IRepositorios;
using Dapper;
using System.Data;

namespace Infraestructura.Repositorios
{
    public class RepositorioActividad : IRepositorioActividad
    {
        private readonly IDBConexion dbconexion;
        public RepositorioActividad(IDBConexion DbConexion)
        {
            dbconexion = DbConexion;
        }

        public async Task<IEnumerable<ResponseConsultarActividad>>ConsultarActividades(long idEtapa)
        {
            using var conexion = dbconexion.CrearConexion();

            var prm = new DynamicParameters();

            prm.Add("@PI_IDETAPA", idEtapa);

            return await conexion.QueryAsync<ResponseConsultarActividad>(
                "SPR_GET_ACTIVIDADES",
                prm,
                commandType: CommandType.StoredProcedure);
        }
    }
}
