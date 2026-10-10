using Aplicacion.Dtos.Tarea;
using Aplicacion.Interfaces;
using Aplicacion.Interfaces.IRepositorios;
using Dapper;
using Infraestructura.Conexion;
using System.Data;

namespace Infraestructura.Repositorios
{
    public class RepositorioTarea : IRepositorioTarea
    {
        private readonly IDBConexion dbconexion;
        public RepositorioTarea(IDBConexion DbConexion)
        {
            dbconexion = DbConexion;
        }

        public async Task<(long, string)> InsertarTarea(RequestCrearTarea request, long idUsuario)
        {
            using var conexion = dbconexion.CrearConexion();
            var prm = new DynamicParameters();
            prm.Add("@PI_DESCRIPCION", request.Descripcion);
            prm.Add("@PI_CAMPANA", request.Campana);
            prm.Add("@PI_IDETAPA", request.IdEtapa);
            prm.Add("@PI_IDUSUARIO", idUsuario);

            var resultado = await conexion.QuerySingleAsync<(long Id, string Codigo)>(
                "SPR_INS_TAREA", prm, commandType: CommandType.StoredProcedure);
            return resultado;
        }

        public async Task<IEnumerable<ResponseConsultarTarea>> ConsultarTareasUsuario(long idUsuario)
        {
            using var conexion = dbconexion.CrearConexion();
            var prm = new DynamicParameters();
            prm.Add("@PI_IDUSUARIO", idUsuario);
            return await conexion.QueryAsync<ResponseConsultarTarea>(
                "SPR_GET_TAREAS_USUARIO", prm, commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<ResponseConsultarTareaAdmin>> ConsultarTareasSinReferencia()
        {
            using var conexion = dbconexion.CrearConexion();
            return await conexion.QueryAsync<ResponseConsultarTareaAdmin>(
                "SPR_GET_TAREAS_SIN_REFERENCIA", commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> ReferenciarTarea(long idTarea, long idTicket)
        {
            using var conexion = dbconexion.CrearConexion();
            var prm = new DynamicParameters();
            prm.Add("@PI_IDTAREA", idTarea);
            prm.Add("@PI_IDTICKET", idTicket);
            var filas = await conexion.QuerySingleAsync<int>(
                "SPR_UPD_REFERENCIAR_TAREA", prm, commandType: CommandType.StoredProcedure);
            return filas > 0;
        }
    }
}
