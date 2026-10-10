using System.ComponentModel.DataAnnotations;

namespace Aplicacion.Dtos.Log
{
    // DTO para insertar registros en la tabla de log de consumo del api
    public class RegistroConsultaLog
    {
        [Required(ErrorMessage = "El campo es requerido")]
        public string Metodo { get; set; }
        [Required(ErrorMessage = "El campo es requerido")]
        public string Datos_entrada { get; set; }
        public string Datos_Salida { get; set; }
        [Required(ErrorMessage = "El campo es requerido")]
        public string Resultado { get; set; }
        public string Msj_error { get; set; }
    }
}
