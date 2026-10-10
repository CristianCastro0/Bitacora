using Aplicacion.Dtos.Rol;
using Aplicacion.Interfaces;
using Aplicacion.Interfaces.IRepositorios;
using Dapper;

namespace Infraestructura.Repositorios
{
    public class RepositorioRol : IRepositorioRol
    {
        private readonly IDBConexion _dbconexion;

        public RepositorioRol(IDBConexion Dbconexion)
        {
            _dbconexion = Dbconexion;
        }

        public async Task<IEnumerable<ResponseConsultarRoles>> ConsultarRoles()
        {
            using var conexion = _dbconexion.CrearConexion();
            return await conexion.QueryAsync<ResponseConsultarRoles>(
                "SPR_GET_ROLES",
                commandType: System.Data.CommandType.StoredProcedure
            );
        }
            
    }
}
