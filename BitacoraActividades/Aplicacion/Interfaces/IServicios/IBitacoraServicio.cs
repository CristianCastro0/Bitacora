using Aplicacion.Dtos.Bitacora;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplicacion.Interfaces.IServicios
{
    public interface IBitacoraServicio
    {
        Task<bool> InsertarRegistroBitacoraAsync(RequestInsertarRegistroBitacora request, long idUsuario);
        Task<ResponseHorasRestantes> ConsultarHorasRestantesAsync(long idAsignacion);
        Task<bool> RegistrarTiempoTareaAsync(RequestRegistrarTiempoTarea request);
    }
}
