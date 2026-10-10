using Aplicacion.Dtos.Log;
using Aplicacion.Interfaces;
using Aplicacion.Interfaces.IRepositorios;
using System.Text;
using System.Text.Json;

namespace BitacoraActividades.Middlewares
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate next;

        public ExceptionMiddleware(RequestDelegate next)
        {
            this.next = next;
        }

        public async Task Invoke(HttpContext context)
        {

            var logBD = context.RequestServices.GetRequiredService<IRepositorioLogBD>();
            var log4Net = context.RequestServices.GetRequiredService<ILog4net>();

            var originalBody = context.Response.Body;
            string requestBody = "";

            try
            {
                context.Request.EnableBuffering();

                using (var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true))
                {
                    requestBody = await reader.ReadToEndAsync();
                    context.Request.Body.Position = 0;
                }

                using var newBody = new MemoryStream();
                context.Response.Body = newBody;

                await next(context);

                newBody.Position = 0;
                string responseBody = await new StreamReader(newBody).ReadToEndAsync();

                var consultaLog = new RegistroConsultaLog()
                {
                    Metodo = context.Request.Path,
                    Resultado = context.Response.StatusCode.ToString(),
                    Datos_entrada = requestBody,
                    Datos_Salida = responseBody
                };

                await RegistrarLogSeguro(logBD, log4Net, consultaLog);

                newBody.Position = 0;
                context.Response.Body = originalBody;
                await newBody.CopyToAsync(originalBody);
            }
            catch (Exception ex)
            {
                // Restauramos el stream original SIEMPRE, incluso si ya se
                // había empezado a escribir algo.
                context.Response.Body = originalBody;

                string mensaje = $"Traza: {ex.StackTrace}, Detalle: {ex.Message}";
                log4Net.LogError(mensaje);

                var consultaLog = new RegistroConsultaLog()
                {
                    Metodo = context.Request.Path,
                    Resultado = "500",
                    Datos_entrada = requestBody,
                    Msj_error = mensaje
                };

                // Solo tocamos la respuesta si todavía no se envió nada al
                // cliente. Si ya empezó a mandarse (HasStarted = true),
                // escribir de nuevo lanza una excepción y esa sí se nos
                // escaparía sin loguear nada.
                if (!context.Response.HasStarted)
                {
                    context.Response.Clear();
                    context.Response.StatusCode = 500;
                    context.Response.ContentType = "application/json";

                    var response = new RespuestaError
                    {
                        Error = "Error",
                        Mensaje = ex.Message
                    };

                    consultaLog.Datos_Salida = JsonSerializer.Serialize(response);

                    await RegistrarLogSeguro(logBD, log4Net, consultaLog);

                    await context.Response.WriteAsJsonAsync(response);
                }
                else
                {
                    await RegistrarLogSeguro(logBD, log4Net, consultaLog);
                }
            }
        }

        // Antes esto solo hacía Console.WriteLine si fallaba el insert en BD,
        // y en IIS la consola no va a ningún lado, así que el fallo quedaba
        // invisible. Ahora, si el insert en BD falla, cae al log4net (archivo
        // en disco) para que quede constancia en algún lado siempre.
        private static async Task RegistrarLogSeguro(IRepositorioLogBD logBD, ILog4net log4Net, RegistroConsultaLog consultaLog)
        {
            try
            {
                await logBD.RegistrarConsulta(consultaLog);
            }
            catch (Exception logEx)
            {
                log4Net.LogError(
                    $"No se pudo insertar el registro de log en BD para {consultaLog.Metodo}. " +
                    $"Motivo: {logEx.Message}. Datos: {JsonSerializer.Serialize(consultaLog)}");
            }
        }
    }
}