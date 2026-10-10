namespace Aplicacion.Dtos.Usuario
{
    // DTO que mapea la lista de colaboradores de un ticket, se usa internamente para mostrar el detalle de un ticket
    public class ColaboradorDto
    {
        public long IdColaborador { get; set; }
        public string? NombreColaborador { get; set; }
        public long IdRol { get; set; }
        public long IdAsignacion { get; set; }
    }
}
