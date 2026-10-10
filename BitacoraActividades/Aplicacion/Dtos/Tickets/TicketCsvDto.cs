using CsvHelper.Configuration.Attributes;

namespace Aplicacion.Dtos.Tickets
{
    public class TicketCsvDto
    {
        [Name("number")]
        public string Number { get; set; }

        [Name("short_description")]
        public string ShortDescription { get; set; }

        [Name("opened_at")]
        public DateTime OpenedAt { get; set; }
        
        [Name("assigned_to")]
        public string AssignedTo { get; set; }
    }
}