namespace Dominio.Modelos
{
    public class Ticket
    {
        public long Id {  get; set; }
        public string Tipo { get; set; }
        public string Codigo { get; set; }
        public DateOnly FechaCreacion { get; set; }
        public string Nombre { get; set; }
        public string Campana { get; set; }
        public string Aplicativo { get; set; }
        public string Estado { get; set; }
    }
}
