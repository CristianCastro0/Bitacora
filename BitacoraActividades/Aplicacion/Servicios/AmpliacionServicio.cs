using Aplicacion.Dtos.Ampliacion;
using Aplicacion.Dtos.Asignacion;
using Aplicacion.Interfaces.IRepositorios;
using Aplicacion.Interfaces.IServicios;

namespace Aplicacion.Servicios
{
    public class AmpliacionServicio : IAmpliacionServicio
    {
        private readonly IRepositorioAmpliacion repositorioAmpliacion;
        private readonly IUsuarioServicio usuarioServicio;
        private readonly IRepositorioAsignacion repositorioAsignacion;

        public AmpliacionServicio(IRepositorioAmpliacion repositorioAmpliacion, IUsuarioServicio usuarioServicio, IRepositorioAsignacion repositorioAsignacion)
        {
            this.repositorioAmpliacion = repositorioAmpliacion;
            this.usuarioServicio = usuarioServicio;
            this.repositorioAsignacion = repositorioAsignacion;
        }

        public async Task<bool> InsertarAmpliacionAsync(RequestGestionarAmpliacion request, string directorio)
        {
            if (request.IdRolEsperado.HasValue)
            {
                var rolReal = await repositorioAsignacion.ObtenerRolPorAsignacion(request.IdAsignacion);

                if (rolReal == null)
                    throw new Exception("No existe ninguna asignación con ese idAsignacion.");

                if (rolReal.Value != request.IdRolEsperado.Value)
                    throw new Exception("La categoría indicada no coincide con el rol real de esta asignación.");
            }

            await repositorioAmpliacion.InsertarAmpliacion(request);

            await repositorioAsignacion.ActualizarAsignacion(new RequestActualizarAsignacion
            {
                IdAsignacion = request.IdAsignacion,
                IdEstado = 1
            });

            return true;
        }
    }
}