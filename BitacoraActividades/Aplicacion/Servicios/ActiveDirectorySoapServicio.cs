using Aplicacion.Dtos.Usuario;
using Aplicacion.Interfaces.IServicios;
using System.Text;
using System.Xml.Linq;

namespace Aplicacion.Servicios
{
    public class ActiveDirectorySoapServicio : IActiveDirectorySoapServicio
    {
        private readonly HttpClient httpClient;
        private const string UrlServicio = "http://localhost:9081/WSActiveDirectory/ws.asmx";
        private const string DominioHost = "tuempresa";

        public ActiveDirectorySoapServicio(HttpClient httpClient)
        {
            this.httpClient = httpClient;
        }

        public async Task<UsuarioADDto> BuscarUsuarioAsync(string usuario)
        {
            var sobreXml = $@"<?xml version=""1.0"" encoding=""utf-8""?>
<soap:Envelope xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance""
               xmlns:xsd=""http://www.w3.org/2001/XMLSchema""
               xmlns:soap=""http://schemas.xmlsoap.org/soap/envelope/"">
  <soap:Body>
    <SearchUserAccount xmlns=""http://tempuri.org/"">
      <domainHost>{DominioHost}</domainHost>
      <userAccount>{usuario}</userAccount>
    </SearchUserAccount>
  </soap:Body>
</soap:Envelope>";

            var contenido = new StringContent(sobreXml, Encoding.UTF8, "text/xml");
            contenido.Headers.Add("SOAPAction", "\"http://tempuri.org/SearchUserAccount\"");

            HttpResponseMessage respuesta;
            try
            {
                respuesta = await httpClient.PostAsync(UrlServicio, contenido);
            }
            catch
            {
                return null;
            }

            if (!respuesta.IsSuccessStatusCode)
                return null;

            var xml = await respuesta.Content.ReadAsStringAsync();
            var documento = XDocument.Parse(xml);

            XNamespace ns = "http://tempuri.org/";
            var resultado = documento.Descendants(ns + "SearchUserAccountResult").FirstOrDefault();

            var dn = resultado?.Element(ns + "distinguishedName")?.Value;

            if (string.IsNullOrEmpty(dn))
                return null;

            return new UsuarioADDto
            {
                SamAccountName = resultado.Element(ns + "samaccountname")?.Value,
                Mail = string.IsNullOrWhiteSpace(resultado.Element(ns + "mail")?.Value)? null: resultado.Element(ns + "mail")!.Value,
                EmployeeId = resultado.Element(ns + "EmployeeID")?.Value,
                Apellido = resultado.Element(ns + "sn")?.Value,
                Nombre = resultado.Element(ns + "givenName")?.Value,
                DistinguishedName = dn,
            };
        }
    }
}