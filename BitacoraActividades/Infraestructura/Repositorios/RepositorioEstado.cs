using Aplicacion.Dtos.Estado;
using Aplicacion.Interfaces;
using Aplicacion.Interfaces.IRepositorios;
using Dapper;

namespace Infraestructura.Repositorios
{
    public class RepositorioEstado : IRepositorioEstado
    {
        private readonly IDBConexion _dbconexion;

        public RepositorioEstado(IDBConexion Dbconexion)
        {
            _dbconexion = Dbconexion;
        }

        public async Task<IEnumerable<ResponseConsultarEstados>> ConsultarEstados()
        {
            using var conexion = _dbconexion.CrearConexion();
            return await conexion.QueryAsync<ResponseConsultarEstados>(
                "SPR_GET_ESTADOS",
                commandType: System.Data.CommandType.StoredProcedure
            );
        }
            
    }
}
