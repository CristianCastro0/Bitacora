namespace Dominio.Modelos
{
    public class Tarea
    {
        public long Id { get; set; }
        public string Codigo { get; set; }
        public string Descripcion { get; set; }
        public string Campana { get; set; }
        public long IdEtapa { get; set; }
        public long IdUsuario { get; set; }
        public long? IdTicket { get; set; }
    }
}
