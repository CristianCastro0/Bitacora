using Aplicacion.Dtos.Rol;

namespace Aplicacion.Interfaces.IServicios
{
    public interface IRolServicio
    {
        Task<IEnumerable<ResponseConsultarRoles>> ConsultarRolesAsync();
    }
}