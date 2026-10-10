using Aplicacion.Dtos.Asignacion;
namespace Aplicacion.Interfaces.IServicios
{
    public interface IAsignacionServicio
    {
        Task<bool> InsertarAsignacionAsync(RequestInsertarAsignacion request);
        Task<bool> EstablecerHorasPrimeraVezAsync(long idAsignacion, decimal cantidadHoras);
    }
}
