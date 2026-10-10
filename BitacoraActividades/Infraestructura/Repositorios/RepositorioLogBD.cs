using Aplicacion.Dtos.Log;
using Aplicacion.Interfaces;
using Aplicacion.Interfaces.IRepositorios;
using Dapper;
using System.Data;

namespace Infraestructura.Repositorios
{
    public class RepositorioLogBD : IRepositorioLogBD
    {
        private readonly IDBConexion _dbconexion;

        public RepositorioLogBD(IDBConexion Dbconexion)
        {
            _dbconexion = Dbconexion;
        }

        // Registra en base de datos las solicitudes y respuestas de la API,
        // diferenciando entre consultas exitosas y errores para fines de auditoría y monitoreo
        public async Task<int> RegistrarConsulta(RegistroConsultaLog log) 
        {
            try
            {
                using var connection = _dbconexion.CrearConexion();
                var parameters = new DynamicParameters();
                parameters.Add("@PI_PROCESO", log.Msj_error != null ? 2 : 1);
                parameters.Add("@PI_CON_CMETODO", log.Metodo);
                parameters.Add("@PI_CON_CDATOS_ENTRADA", log.Datos_entrada ?? "");
                parameters.Add("@PI_CON_CDATOS_SALIDA", log.Datos_Salida);
                parameters.Add("@PI_CON_CRESULTADO", log.Resultado);
                parameters.Add("@PI_CON_CMSJ_ERROR", log.Msj_error);

                return await connection.ExecuteAsync(
                    "SPR_INS_CONSULTA_API",
                    parameters,
                    commandType: CommandType.StoredProcedure
                );
            }
            catch (Exception)
            {
                throw;
            }
        }
    }
}
