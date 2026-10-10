namespace Aplicacion.Dtos.Tarea
{
    public class RequestCrearTarea
    {
        public string Descripcion { get; set; }
        public string Campana { get; set; }
        public long IdEtapa { get; set; }
    }
}
