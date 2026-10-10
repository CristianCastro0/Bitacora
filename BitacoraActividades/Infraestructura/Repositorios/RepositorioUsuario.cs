using Aplicacion.Dtos.Usuario;
using Aplicacion.Interfaces;
using Aplicacion.Interfaces.IRepositorios;
using Dapper;

namespace Infraestructura.Repositorios
{
    public class RepositorioUsuario : IRepositorioUsuario
    {
        private readonly IDBConexion dbconexion;
        public RepositorioUsuario(IDBConexion DbConexion)
        {
            dbconexion = DbConexion;
        }

        // Inserta el usuario si no existe en base de datos utilizando información proveniente de AD y retorna sus datos básicos
        public async Task<ResponseConsultarUsuario> ConsultarInsertarUsuario(RequestGIUsuario request)
        {
            using var conexion = dbconexion.CrearConexion();
            var prm = new DynamicParameters();

            prm.Add("@PI_DIRECTORIO", request.Directorio);
            prm.Add("@PI_CORREO", request.Correo);
            prm.Add("@PI_NOMBRE1", request.Nombre1);
            prm.Add("@PI_NOMBRE2", request.Nombre2);
            prm.Add("@PI_APELLIDO1", request.Apellido1);
            prm.Add("@PI_APELLIDO2", request.Apellido2);

            return await conexion.QueryFirstOrDefaultAsync<ResponseConsultarUsuario>(
                "SPR_GI_USUARIO",
                prm,
                commandType: System.Data.CommandType.StoredProcedure
            );
        }

        // Obtiene la lista de todos los usuarios registrados en el sistema con su información principal
        public async Task<IEnumerable<ResponseConsultarUsuario>> ConsultarUsuarios()
        {
            using var conexion = dbconexion.CrearConexion();

            return await conexion.QueryAsync<ResponseConsultarUsuario>(
                "SPR_GET_USUARIOS",
                commandType: System.Data.CommandType.StoredProcedure
            );
        }


        // Actualiza los datos personales de un usuario en base de datos
        public async Task<bool> ActualizarUsuario(RequestActualizarUsuario request)
        {
            using var conexion = dbconexion.CrearConexion();
            var prm = new DynamicParameters();
            prm.Add("@PI_IDUSUARIO", request.Id);
            prm.Add("@PI_NOMBRE1", request.Nombre);
            prm.Add("@PI_NOMBRE2", request.Nombre2);
            prm.Add("@PI_APELLIDO1", request.Apellido);
            prm.Add("@PI_APELLIDO2", request.Apellido2);
            prm.Add("@PI_CORREO", request.Correo);
            prm.Add("@PI_ROLID", request.RolId);
            prm.Add("@PI_ESTADOID", request.EstadoId);


            var result = await conexion.ExecuteAsync(
                "SPR_UPD_USUARIO",
                prm,
                commandType: System.Data.CommandType.StoredProcedure
            );

            return result > 0;
        }
    }
}
