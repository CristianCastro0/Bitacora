using Aplicacion.Dtos.Bitacora;

namespace Aplicacion.Interfaces.IRepositorios
{
    public interface IRepositorioBitacora
    {
        Task<bool> InsertarBitacora(RequestInsertarRegistroBitacora request);
        Task<decimal> ConsultarHorasAsignadas(long idAsignacion);
        Task<decimal> ConsultarHorasTrabajadas(long idAsignacion);

        Task<decimal> ConsultarHorasAmpliadas(long idAsignacion);
        Task<bool> InsertarBitacoraTarea(RequestRegistrarTiempoTarea request);
    }
}
