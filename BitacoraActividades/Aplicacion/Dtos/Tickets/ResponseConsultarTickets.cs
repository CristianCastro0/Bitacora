namespace Aplicacion.Dtos.Tickets
{
    //Response para mostrar en una pantalla los tickets asociados a un usuario
    public class ResponseConsultarTickets
    {
        public long Id { get; set; }
        public string Codigo {  get; set; }
        public string Nombre { get; set; }
    }
}
