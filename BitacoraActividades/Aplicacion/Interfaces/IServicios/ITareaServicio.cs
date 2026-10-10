using Aplicacion.Dtos.Tarea;

namespace Aplicacion.Interfaces.IServicios
{
    public interface ITareaServicio
    {
        Task<ResponseCrearTarea> CrearTareaAsync(RequestCrearTarea request, long idUsuario);
        Task<IEnumerable<ResponseConsultarTarea>> ConsultarTareasUsuarioAsync(long idUsuario);
        Task<IEnumerable<ResponseConsultarTareaAdmin>> ConsultarTareasSinReferenciaAsync();
        Task<bool> ReferenciarTareaAsync(RequestReferenciarTarea request);
    }
}
