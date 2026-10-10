using Aplicacion.Dtos.Tarea;
using Aplicacion.Interfaces.IRepositorios;
using Aplicacion.Interfaces.IServicios;

namespace Aplicacion.Servicios
{
    public class TareaServicio : ITareaServicio
    {
        private readonly IRepositorioTarea repositorioTarea;
        public TareaServicio(IRepositorioTarea repositorioTarea)
        {
            this.repositorioTarea = repositorioTarea;
        }
        public async Task<ResponseCrearTarea> CrearTareaAsync(RequestCrearTarea request, long idUsuario)
        {
            var (id, codigo) = await repositorioTarea.InsertarTarea(request, idUsuario);
            return new ResponseCrearTarea { Id = id, Codigo = codigo };
        }

        public Task<IEnumerable<ResponseConsultarTarea>> ConsultarTareasUsuarioAsync(long idUsuario)
            => repositorioTarea.ConsultarTareasUsuario(idUsuario);

        public Task<IEnumerable<ResponseConsultarTareaAdmin>> ConsultarTareasSinReferenciaAsync()
            => repositorioTarea.ConsultarTareasSinReferencia();

        public Task<bool> ReferenciarTareaAsync(RequestReferenciarTarea request)
            => repositorioTarea.ReferenciarTarea(request.IdTarea, request.IdTicket);
    }
}
