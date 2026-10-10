using Aplicacion.Dtos.Rol;

namespace Aplicacion.Interfaces.IRepositorios
{
    public interface IRepositorioRol
    {
        Task<IEnumerable<ResponseConsultarRoles>> ConsultarRoles();
    }
}