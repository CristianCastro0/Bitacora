using Aplicacion.Dtos.Actividad;
using Aplicacion.Interfaces.IRepositorios;
using Aplicacion.Interfaces.IServicios;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplicacion.Servicios
{
    public class ActividadServicio : IActividadServicio
    {
        private readonly IRepositorioActividad repositorioActividad;

        public ActividadServicio(IRepositorioActividad repositorioActividad)
        {
            this.repositorioActividad = repositorioActividad;
        }

        public async Task<IEnumerable<ResponseConsultarActividad>>ConsultarActividadesAsync(long idEtapa)
        {
            return await repositorioActividad
                .ConsultarActividades(idEtapa);
        }
    }
}
