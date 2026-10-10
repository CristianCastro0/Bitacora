using Aplicacion.Interfaces;
using Microsoft.Data.SqlClient;
using System.Data;
using Microsoft.Extensions.Configuration;

namespace Infraestructura.Conexion
{
    public class DBConexion : IDBConexion
    {
        
            private readonly string _CadenaConexion;
            private IConfiguration configuration;
            private readonly IEncriptar encriptar;

            public DBConexion(IConfiguration configuration, IEncriptar encriptar)
            {
                this.configuration = configuration;
                this.encriptar = encriptar;
                var valor = configuration.GetConnectionString("Conexion");
                if (string.IsNullOrWhiteSpace(valor))
                    throw new InvalidOperationException("Falta ConnectionStrings:Conexion en la configuración.");

                // Acepta la cadena en texto plano (desarrollo local) o cifrada con Encriptar (despliegue).
                // Una cadena de conexión en claro siempre contiene ';' y un Base64 nunca.
                _CadenaConexion = valor.Contains(';') ? valor : encriptar.Cifrado(2, valor);
            }

            public IDbConnection CrearConexion()
            {
                return new SqlConnection(_CadenaConexion);
            }
        
    }

}

