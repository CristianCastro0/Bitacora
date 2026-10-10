using Aplicacion.Dtos.Estado;

namespace Aplicacion.Interfaces.IRepositorios
{
    public interface IRepositorioEstado
    {
        Task<IEnumerable<ResponseConsultarEstados>> ConsultarEstados();
    }
}