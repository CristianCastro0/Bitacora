using Aplicacion.Dtos.Actividad;

namespace Aplicacion.Interfaces.IServicios
{
    public interface IActividadServicio
    {
        Task<IEnumerable<ResponseConsultarActividad>> ConsultarActividadesAsync(long idEtapa);
    }
}
