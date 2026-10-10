using Aplicacion.Dtos.Usuario;
using Dominio.Modelos;

namespace Aplicacion.Interfaces.IRepositorios
{
    public interface IRepositorioUsuario
    {
        Task<ResponseConsultarUsuario> ConsultarInsertarUsuario(RequestGIUsuario request);

        Task<IEnumerable<ResponseConsultarUsuario>> ConsultarUsuarios();
        Task<bool> ActualizarUsuario(RequestActualizarUsuario request);

    }
}
