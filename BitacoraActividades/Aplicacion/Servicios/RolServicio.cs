using Aplicacion.Dtos.Rol;
using Aplicacion.Interfaces.IRepositorios;
using Aplicacion.Interfaces.IServicios;

namespace Aplicacion.Servicios
{
    public class RolServicio : IRolServicio
    {
        private readonly IRepositorioRol repositorioRol;

        public RolServicio(IRepositorioRol repositorioRol)
        {
            this.repositorioRol = repositorioRol;
        }

        // Obtiene la lista de roles disponibles y los transforma a un response para el frontend
        public async Task<IEnumerable<ResponseConsultarRoles>> ConsultarRolesAsync()
        {
            var result = await repositorioRol.ConsultarRoles();

            return result.Select(x => new ResponseConsultarRoles
            {
                Id = x.Id,
                Nombre = x.Nombre
            });
        }
    }
}