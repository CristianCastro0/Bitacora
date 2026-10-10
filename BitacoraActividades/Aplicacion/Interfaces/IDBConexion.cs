using System.Data;

namespace Aplicacion.Interfaces
{
    public interface IDBConexion
    {
        IDbConnection CrearConexion();
    }
}
