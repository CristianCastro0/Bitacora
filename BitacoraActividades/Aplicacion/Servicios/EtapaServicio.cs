using Aplicacion.Dtos.Etapa;
using Aplicacion.Interfaces.IRepositorios;
using Aplicacion.Interfaces.IServicios;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplicacion.Servicios
{
    public class EtapaServicio : IEtapaServicio
    {
        private readonly IRepositorioEtapa repositorioEtapa;

        public EtapaServicio(IRepositorioEtapa repositorioEtapa)
        {
            this.repositorioEtapa = repositorioEtapa;
        }

        public async Task<IEnumerable<ResponseConsultarEtapa>>ConsultarEtapasAsync()
        {
            return await repositorioEtapa.ConsultarEtapas();
        }
    }
}
