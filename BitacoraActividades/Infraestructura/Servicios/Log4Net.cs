using Aplicacion.Interfaces;
using System.Reflection;
using Aplicacion.Configs;
using log4net;
using log4net.Config;
using log4net.Core;
using Microsoft.Extensions.Options;

namespace Infraestructura.Servicios
{
    public class Log4Net : ILog4net
    {
        private readonly JwtSettings _jwtSettings;

        public Log4Net(IOptions<JwtSettings> Jwtoptions)
        {
            _jwtSettings = Jwtoptions?.Value ?? throw new ArgumentNullException(nameof(Jwtoptions));

        }
        public void LogError(string message)
        {
            if (Convert.ToBoolean(_jwtSettings.ActivarLog))
            {
                var logRepository = LogManager.GetRepository(Assembly.GetEntryAssembly());
                XmlConfigurator.Configure(logRepository, new FileInfo("log4net.config"));
                ILog _logger = LogManager.GetLogger(typeof(LoggerManager));
                _logger.Error(message);
            }
        }
    }
}
