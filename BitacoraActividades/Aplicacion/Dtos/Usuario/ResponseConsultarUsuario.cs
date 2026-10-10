namespace Aplicacion.Dtos.Usuario
{

    public class ResponseConsultarUsuario
    {
        public long Id { get; set; }
        public string Correo { get; set; }
        public string Nombre { get; set; }
        public string Estado { get; set; }
        public string Rol { get; set; }
    }

}
