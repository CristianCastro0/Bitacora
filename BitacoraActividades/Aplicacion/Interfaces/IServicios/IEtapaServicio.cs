using Aplicacion.Dtos.Etapa;

namespace Aplicacion.Interfaces.IServicios
{
    public interface IEtapaServicio
    {
        Task<IEnumerable<ResponseConsultarEtapa>>ConsultarEtapasAsync();
    }
}
