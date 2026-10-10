using Aplicacion.Dtos.Tarea;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplicacion.Interfaces.IRepositorios
{
    public interface IRepositorioTarea
    {
        Task<(long Id, string Codigo)> InsertarTarea(RequestCrearTarea request, long idUsuario);
        Task<IEnumerable<ResponseConsultarTarea>> ConsultarTareasUsuario(long idUsuario);
        Task<IEnumerable<ResponseConsultarTareaAdmin>> ConsultarTareasSinReferencia();
        Task<bool> ReferenciarTarea(long idTarea, long idTicket);
    }
}
