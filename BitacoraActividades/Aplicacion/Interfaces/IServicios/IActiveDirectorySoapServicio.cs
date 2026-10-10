using Aplicacion.Dtos.Usuario;

namespace Aplicacion.Interfaces.IServicios
{
    public interface IActiveDirectorySoapServicio
    {
        Task<UsuarioADDto> BuscarUsuarioAsync(string usuario);
    }
}