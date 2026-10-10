using Aplicacion.Dtos.Estado;

namespace Aplicacion.Interfaces.IServicios
{
    public interface IEstadoServicio
    {
        Task<IEnumerable<ResponseConsultarEstados>> ConsultarEstadosAsync();
    }
}