using Aplicacion.Dtos.Estado;
using Aplicacion.Interfaces.IRepositorios;
using Aplicacion.Interfaces.IServicios;

namespace Aplicacion.Servicios
{
    public class EstadoServicio : IEstadoServicio
    {
        private readonly IRepositorioEstado repositorioEstado;

        public EstadoServicio(IRepositorioEstado repositorioEstado)
        {
            this.repositorioEstado = repositorioEstado;
        }

        // Obtiene la lista de estados disponibles y los transforma a un response para el frontend
        public async Task<IEnumerable<ResponseConsultarEstados>> ConsultarEstadosAsync()
        {
            var result = await repositorioEstado.ConsultarEstados();

            return result.Select(x => new ResponseConsultarEstados
            {
                Id = x.Id,
                Nombre = x.Nombre
            });
        }
    }
}