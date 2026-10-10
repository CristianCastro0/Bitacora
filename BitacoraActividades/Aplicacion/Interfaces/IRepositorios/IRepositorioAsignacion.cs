using Aplicacion.Dtos.Asignacion;

namespace Aplicacion.Interfaces.IRepositorios
{
    public interface IRepositorioAsignacion
    {
        Task<bool> ActualizarAsignacion(RequestActualizarAsignacion request);
        Task<bool> InsertarAsignacion(long idUsuario, long idTicket, decimal? cantidadHoras, long idRol);
        Task<IEnumerable<long>> ObtenerUsuariosAsignados(long idTicket);
        Task<bool> ActualizarAsignacionesPorPool(long idAsignacion, long idEstado);
        Task<bool> EstablecerHorasPrimeraVez(long idAsignacion, decimal cantidadHoras);
        Task<long?> ObtenerRolPorAsignacion(long idAsignacion);
    }
}