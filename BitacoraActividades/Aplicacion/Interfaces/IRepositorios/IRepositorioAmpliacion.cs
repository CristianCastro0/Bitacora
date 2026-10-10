using Aplicacion.Dtos.Ampliacion;

namespace Aplicacion.Interfaces.IRepositorios
{
    public interface IRepositorioAmpliacion
    {
        Task<bool> InsertarAmpliacion(RequestGestionarAmpliacion request);
    }
}
