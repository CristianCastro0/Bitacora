namespace Dominio.Modelos
{
    public class Usuario
    {
        public long Id { get; set; }
        public string Nombre { get; set; }
        public string Correo { get; set; }
        public string Directorio { get; set; }
        public long RolId { get; set; }
        public long EstadoId { get; set; }
    }
    
}
