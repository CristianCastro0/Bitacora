namespace Aplicacion.Dtos.Usuario
{
    public class RequestActualizarUsuario
    {

        public long Id { get; set; }  
        public string? Nombre { get; set; }
        public string? Nombre2 { get; set; }
        public string? Apellido { get; set; }
        public string? Apellido2 { get; set; }
        public string? Correo { get; set; }
        public long? RolId { get; set; }
        public long? EstadoId { get; set; }
    }
}
