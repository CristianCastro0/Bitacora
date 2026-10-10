namespace Aplicacion.Dtos.Ampliacion
{
    public class RequestGestionarAmpliacion
    {
        public decimal HorasAmpliadas { get; set; }
        public string Observacion { get; set; }
        public long IdAsignacion { get; set; }
        public long? IdRolEsperado { get; set; }
    }
}
