using Aplicacion.Dtos.Log;

namespace Aplicacion.Interfaces.IRepositorios
{
    public interface IRepositorioLogBD
    {
        Task<int> RegistrarConsulta(RegistroConsultaLog log);
    }
}
