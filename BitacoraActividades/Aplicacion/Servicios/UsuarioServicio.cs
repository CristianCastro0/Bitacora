 using Aplicacion.Dtos.Usuario;
using Aplicacion.Interfaces.IRepositorios;
using Aplicacion.Interfaces.IServicios;
using Dominio.Modelos;
using System.DirectoryServices.AccountManagement;
using System.Net.Mime;

namespace Aplicacion.Servicios
{
    public class UsuarioServicio : IUsuarioServicio
    {
        private readonly IRepositorioUsuario repositorioUsuario;
        public UsuarioServicio(IRepositorioUsuario repositorioUsuario) 
        {
            this.repositorioUsuario = repositorioUsuario;
        }

        // Consulta el usuario en Directorio Activo, lo registra en la base de datos si no existe y retorna su Id
        public async Task<ResponseConsultarUsuario> ConsultarInsertarUsuarioAsync(UsuarioAdDto usuarioAd)
        {
            var request = new RequestGIUsuario
            {
                Directorio = usuarioAd.Directorio,
                Correo = usuarioAd.Correo,
                Nombre1 = usuarioAd.Nombre1,
                Nombre2 = usuarioAd.Nombre2,
                Apellido1 = usuarioAd.Apellido1,
                Apellido2 = usuarioAd.Apellido2
            };


                return await repositorioUsuario.ConsultarInsertarUsuario(request);
        }

        // Obtiene la lista de todos los usuarios registrados en el sistema
        public async Task<IEnumerable<ResponseConsultarUsuario>> ConsultarUsuariosAsync()
        {
            var result = await repositorioUsuario.ConsultarUsuarios();

            return result;
        }

        // Actualiza la información de un usuario en base de datos
        public async Task<bool> ActualizarUsuarioAsync(RequestActualizarUsuario request)
        {
            var result = await repositorioUsuario.ActualizarUsuario(request);
            return result;
        }

    

    }
}
