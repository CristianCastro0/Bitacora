using Aplicacion.Dtos.Ampliacion;

namespace Aplicacion.Interfaces.IServicios
{
    public interface IAmpliacionServicio
    {
        Task<bool> InsertarAmpliacionAsync(RequestGestionarAmpliacion request, string directorio);
    }
}
