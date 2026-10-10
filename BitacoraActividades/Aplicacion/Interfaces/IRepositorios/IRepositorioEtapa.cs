using Aplicacion.Dtos.Etapa;

namespace Aplicacion.Interfaces.IRepositorios
{
    public interface IRepositorioEtapa
    {
        Task<IEnumerable<ResponseConsultarEtapa>>ConsultarEtapas();
        Task<bool> ValidarAccesoPorAsignacion(long idAsignacion);
    }
}
