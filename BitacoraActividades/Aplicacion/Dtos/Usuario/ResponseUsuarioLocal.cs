namespace Aplicacion.Dtos.Usuario
{
    public class ResponseUsuarioLocal
{
    public long Id { get; set; }
    public string Correo { get; set; }
    public string Directorio { get; set; }
    public long IdRol { get; set; }
    public long IdEstado { get; set; }
    public string NombreCompleto { get; set; }
}
}