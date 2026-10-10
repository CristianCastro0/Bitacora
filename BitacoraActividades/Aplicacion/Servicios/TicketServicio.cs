using Aplicacion.Dtos.Tickets;
using Aplicacion.Dtos.Usuario;
using Aplicacion.Interfaces.IRepositorios;
using Aplicacion.Interfaces.IServicios;
using CsvHelper;
using System.Globalization;
using Microsoft.AspNetCore.Http;
using CsvHelper.Configuration;

namespace Aplicacion.Servicios
{
    public class TicketServicio : ITicketServicio
    {
        private readonly IRepositorioTicket repositorioTicket;
        private readonly IUsuarioServicio usuarioServicio;
        private readonly IRepositorioEtapa repositorioEtapa;
        private readonly IRepositorioAsignacion repositorioAsignacion;
        public TicketServicio(IRepositorioTicket repositorioTicket, IUsuarioServicio usuarioServicio, IRepositorioEtapa repositorioEtapa, IRepositorioAsignacion repositorioAsignacion)
        {
            this.repositorioTicket = repositorioTicket;
            this.usuarioServicio = usuarioServicio;
            this.repositorioEtapa = repositorioEtapa;
            this.repositorioAsignacion = repositorioAsignacion;
        }

        private const long ROL_ID_SENIOR = 2;

        // Obtiene los tickets asociados al usuario logueado y los transforma a un response para el frontend
        public async Task<IEnumerable<ResponseConsultarTickets>> ConsultarTicketsAsync(long idUsuario)
        {
            var result = await repositorioTicket.ConsultarTicket(idUsuario);

            return result.Select(x => new ResponseConsultarTickets
            {
                Id = x.Id,
                Codigo = x.Codigo,
                Nombre = ObtenerNombreCorto(x.Nombre)
            });
            
        }

        // Obtiene el detalle completo de un ticket, incluyendo información general y lista de colaboradores
        public async Task<ResponseConsultarDetalleTicket> ConsultarDetalleTicketAsync(long id, long idUsuario)
        {
            var result = await repositorioTicket.ConsultarDetalleTicket(id, idUsuario);
            var first = result.FirstOrDefault(x => x.EsUsuarioActual) ?? result.FirstOrDefault();

            if (first == null)
                return null;

            var puedeTrabajar = await repositorioEtapa.ValidarAccesoPorAsignacion(first.IdAsignacion);

            // IDs de Rol: Senior=2, Desarrollo=3, Calidad=4
            CategoriaDetalleDto? MapearCategoria(long idRol) =>
                result.Where(x => x.IdRol == idRol)
                      .Select(x => new CategoriaDetalleDto { IdAsignacion = x.IdAsignacion, Horas = x.HorasAsignadas })
                      .FirstOrDefault();

            return new ResponseConsultarDetalleTicket
            {
                Id = first.Id,
                IdAsignacion = first.IdAsignacion,
                Tipo = first.Tipo,
                Codigo = first.Codigo,
                Fecha = first.Fecha,
                Descripcion = first.Descripcion,
                HorasAsignadas = first.HorasAsignadas,
                IdEtapa = first.IdEtapa,
                Etapa = first.Etapa,
                PuedeTrabajar = puedeTrabajar,
                Senior = MapearCategoria(2),
                Desarrollo = MapearCategoria(3),
                Calidad = MapearCategoria(4),
                Colaboradores = result.Select(x => new ColaboradorDto
                {
                    IdColaborador = x.IdColaborador,
                    NombreColaborador = x.NombreColaborador,
                    IdRol = x.IdRol,
                    IdAsignacion = x.IdAsignacion,
                }).ToList()
            };
        }

        // Mismo criterio de normalización que ya usa Front_v1.8.2 (ScriptAsignacionTicket.js)
        // para poder cruzar "Assigned to" del CSV contra el Maestro de Usuarios.
        private static string NormalizarTexto(string texto)
        {
            if (string.IsNullOrWhiteSpace(texto)) return "";
            var normalizado = texto.ToLowerInvariant().Trim()
                .Normalize(System.Text.NormalizationForm.FormD);
            var sinTildes = new string(normalizado
                .Where(c => System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c)
                    != System.Globalization.UnicodeCategory.NonSpacingMark)
                .ToArray());
            return System.Text.RegularExpressions.Regex.Replace(sinTildes, @"\s+", " ");
        }

        public async Task<int> CargarCsvAsync(Stream stream)
        {
            var fechaCarga = DateTime.Now;

            using var reader = new StreamReader(stream);
            using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
            var registros = csv.GetRecords<TicketCsvDto>().ToList();

            // Se trae el maestro de usuarios UNA sola vez para todo el CSV,
            // no por cada fila.
            var usuariosPorNombre = (await usuarioServicio.ConsultarUsuariosAsync())
                .ToDictionary(u => NormalizarTexto(u.Nombre), u => u, StringComparer.Ordinal);

            foreach (var ticket in registros)
            {
                long tipo = ticket.Number.StartsWith("RITM") ? 1 : 2;
                var responsable = ticket.AssignedTo?.Trim();
                if (string.IsNullOrWhiteSpace(responsable)) responsable = null;

                var idTicket = await repositorioTicket.InsertarActualizarTicket(
                    ticket, tipo, responsable, fechaCarga);

                if (idTicket > 0 && responsable != null)
                {
                    await AutoasignarSeniorSiAplica(idTicket, responsable, usuariosPorNombre);
                }
            }

            await repositorioTicket.CerrarTicketsAusentes(fechaCarga);

            return registros.Count;
        }

        // Si el responsable del CSV existe en el Maestro de Usuarios y el ticket
        // todavía no tiene una asignación de Senior, crea la fila "vacía" (sin
        // horas) para que luego se llene con EstablecerHorasPrimeraVez desde la
        // web de admin
        private async Task AutoasignarSeniorSiAplica(long idTicket,string responsable,Dictionary<string, ResponseConsultarUsuario> usuariosPorNombre)
        {
            if (!usuariosPorNombre.TryGetValue(NormalizarTexto(responsable), out var usuarioSenior))
                return;

            var yaAsignados = (await repositorioAsignacion.ObtenerUsuariosAsignados(idTicket)).ToHashSet();
            if (yaAsignados.Contains(usuarioSenior.Id))
                return;

            await repositorioAsignacion.InsertarAsignacion(
                idUsuario: usuarioSenior.Id,
                idTicket: idTicket,
                cantidadHoras: null,
                idRol: ROL_ID_SENIOR);
        }


        // Muestra solo el texto después del último "|" para que la pastilla no quede tan larga
        private static string ObtenerNombreCorto(string descripcion)
        {
            if (string.IsNullOrWhiteSpace(descripcion))
                return descripcion;

            var partes = descripcion.Split('|');
            return partes[^1].Trim();
        }

        public async Task<IEnumerable<ResponseConsultarTicket>> ConsultarTicketsGrillaAsync()
        {
            return await repositorioTicket.ConsultarTicketsGrilla();
        }
        public async Task<IEnumerable<ResponseConsultarTicketsAsignacion>>ConsultarTicketsAsignacionAsync()
        {
            return await repositorioTicket.ConsultarTicketsAsignacion();
        }

    }
}
