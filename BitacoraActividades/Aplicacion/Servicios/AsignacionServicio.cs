using Aplicacion.Dtos.Asignacion;
using Aplicacion.Dtos.Etapa;
using Aplicacion.Interfaces.IRepositorios;
using Aplicacion.Interfaces.IServicios;

namespace Aplicacion.Servicios
{
    //Servicio encargado de la logica de negocio de las asignaciones
    public class AsignacionServicio : IAsignacionServicio
    {
        private readonly IRepositorioAsignacion repositorioAsignacion;
        public AsignacionServicio(IRepositorioAsignacion repositorioAsignacion)
        {
            this.repositorioAsignacion = repositorioAsignacion;
             
        }

        public async Task<bool> InsertarAsignacionAsync(RequestInsertarAsignacion request)
        {
            if (request.IdsUsuarios == null ||
                !request.IdsUsuarios.Any())
                return false;

            var yaAsignados = (
                await repositorioAsignacion
                .ObtenerUsuariosAsignados(request.IdTicket))
                .ToHashSet();

            var nuevos = request.IdsUsuarios
                .Where(id => !yaAsignados.Contains(id))
                .ToList();

            if (!nuevos.Any())
                return true;

            var resultados = new List<bool>();

            foreach (var idUsuario in nuevos)
            {
                var exito =
                    await repositorioAsignacion.InsertarAsignacion(
                        idUsuario,
                        request.IdTicket,
                        request.CantidadHoras,
                        request.IdRol
                    );

                resultados.Add(exito);
            }

            return resultados.All(r => r);
        }
        public async Task<bool> EstablecerHorasPrimeraVezAsync(long idAsignacion, decimal cantidadHoras)
        {
            return await repositorioAsignacion.EstablecerHorasPrimeraVez(idAsignacion, cantidadHoras);
        }

    }
}
