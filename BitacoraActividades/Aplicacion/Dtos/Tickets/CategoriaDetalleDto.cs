namespace Aplicacion.Dtos.Tickets
{
    // Una categoría (Senior/Desarrollo/Calidad) dentro del detalle de un
    // ticket. Null cuando esa categoría todavía no tiene a nadie asignado.
    public class CategoriaDetalleDto
    {
        public long IdAsignacion { get; set; }
        public decimal Horas { get; set; }
    }
}