using Aplicacion.Dtos.Actividad;

namespace Aplicacion.Interfaces.IRepositorios
{
    public interface IRepositorioActividad
    {
        Task<IEnumerable<ResponseConsultarActividad>>ConsultarActividades(long idEtapa);
    }
}
