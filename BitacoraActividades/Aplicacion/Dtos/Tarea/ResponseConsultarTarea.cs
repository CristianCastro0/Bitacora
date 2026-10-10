namespace Aplicacion.Dtos.Tarea
{
    public class ResponseConsultarTarea
    {
        public long Id { get; set; }
        public string Codigo { get; set; }
        public string Descripcion { get; set; }
        public string Campana { get; set; }
        public string Etapa { get; set; }
        public decimal HorasTrabajadas { get; set; }
    }
}
