using Aplicacion.Dtos.Usuario;
using Dominio.Modelos;

namespace Aplicacion.Interfaces.IServicios
{
    public interface IUsuarioServicio
    {
        Task<ResponseConsultarUsuario> ConsultarInsertarUsuarioAsync(UsuarioAdDto usuarioAd);
        Task<IEnumerable<ResponseConsultarUsuario>> ConsultarUsuariosAsync();
        Task<bool> ActualizarUsuarioAsync(RequestActualizarUsuario request);
    }
}
