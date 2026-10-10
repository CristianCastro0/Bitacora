namespace Aplicacion.Dtos.Log
{
    // 
    public class ResponseError
    {
        public string Type { get; set; }
        public string Title { get; set; }
        public int Status { get; set; }
        public string TraceId { get; set; }
        public List<string> Errors { get; set; }
    }
}
