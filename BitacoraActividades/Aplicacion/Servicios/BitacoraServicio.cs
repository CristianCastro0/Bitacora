using Aplicacion.Dtos.Asignacion;
using Aplicacion.Dtos.Bitacora;
using Aplicacion.Interfaces.IRepositorios;
using Aplicacion.Interfaces.IServicios;

namespace Aplicacion.Servicios
{
    public class BitacoraServicio : IBitacoraServicio
    {
        private readonly IRepositorioBitacora repositorioBitacora;
        private readonly IRepositorioAsignacion repositorioAsignacion;
        private readonly IUsuarioServicio usuarioServicio;
        private readonly IRepositorioEtapa repositorioEtapa;
        public BitacoraServicio(IRepositorioBitacora repositorioBitacora, IUsuarioServicio usuarioServicio, IRepositorioAsignacion repositorioAsignacion, IRepositorioEtapa repositorioEtapa)
        {
            this.repositorioBitacora = repositorioBitacora;
            this.usuarioServicio = usuarioServicio;
            this.repositorioAsignacion = repositorioAsignacion;
            this.repositorioEtapa = repositorioEtapa;
        }


        // Servicio encargado de la lógica de negocio para registrar horas en la bitácora.
        // Valida las horas disponibles del ticket y, en caso de alcanzar el límite,
        // actualiza el estado de la asignación correspondiente.

        public async Task<bool> InsertarRegistroBitacoraAsync(RequestInsertarRegistroBitacora request, long idUsuario)
        {
            var tieneAcceso = await repositorioEtapa.ValidarAccesoPorAsignacion(request.IdAsignacion);

            if (!tieneAcceso)
                throw new Exception("Tu rol no esta habilitado para trabajar en la etapa actual del ticket");

            var horasTrabajadas = await repositorioBitacora.ConsultarHorasTrabajadas(request.IdAsignacion);

            var horasAsignadas = await repositorioBitacora.ConsultarHorasAsignadas(request.IdAsignacion);

            var horasAmpliadas = await repositorioBitacora.ConsultarHorasAmpliadas(request.IdAsignacion);

            var totalDisponible = horasAsignadas + horasAmpliadas;

            if (horasTrabajadas + request.HorasTrabajadas > totalDisponible)
                throw new Exception("Las horas exceden el límite asignado");

            await repositorioBitacora.InsertarBitacora(request);

            var totalHoras = await repositorioBitacora.ConsultarHorasTrabajadas(request.IdAsignacion);

            if (totalHoras >= totalDisponible)
            {

                await repositorioAsignacion.ActualizarAsignacionesPorPool(request.IdAsignacion, idEstado: 3);
            }


            return true;

        }

        public async Task<ResponseHorasRestantes> ConsultarHorasRestantesAsync(long idAsignacion)
        {
            var horasTrabajadas = await repositorioBitacora.ConsultarHorasTrabajadas(idAsignacion);
            var horasAsignadas = await repositorioBitacora.ConsultarHorasAsignadas(idAsignacion);
            var horasAmpliadas = await repositorioBitacora.ConsultarHorasAmpliadas(idAsignacion);

            var totalDisponible = horasAsignadas + horasAmpliadas;
            var restantes = totalDisponible - horasTrabajadas;

            return new ResponseHorasRestantes
            {
                HorasAsignadas = horasAsignadas,
                HorasAmpliadas = horasAmpliadas,
                HorasTrabajadas = horasTrabajadas,
                HorasRestantes = restantes < 0 ? 0 : restantes
            };
        }
        public async Task<bool> RegistrarTiempoTareaAsync(RequestRegistrarTiempoTarea request)
        {
            return await repositorioBitacora.InsertarBitacoraTarea(request);
        }
    }
}
