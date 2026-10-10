using Aplicacion.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Security.Cryptography;
using System.Text;

namespace Aplicacion.Servicios
{
    public class Encriptar : IEncriptar
    {
        private readonly IConfiguration configuration;

        public Encriptar(IConfiguration configuration)
        {
            this.configuration = configuration;
        }

        public string Cifrado(byte modo, string cadena)
        {
            byte[] dataBytes;
            // La clave (32 caracteres = 256 bits) y el IV (16 caracteres = 128 bits) no viven en el código:
            // se leen de la configuración (Security:EncryptionKey y Security:EncryptionIV), idealmente desde
            // user-secrets o variables de entorno (Security__EncryptionKey y Security__EncryptionIV).
            string strKey = configuration["Security:EncryptionKey"] ?? "";
            string strIV = configuration["Security:EncryptionIV"] ?? "";
            // Preparamos el input según el modo
            if (modo == 1) // Encriptar
            {
                dataBytes = Encoding.UTF8.GetBytes(cadena);
            }
            else if (modo == 2) // Desencriptar
            {
                dataBytes = Convert.FromBase64String(cadena);
            }
            else
            {
                throw new ArgumentException("Modo inválido");
            }

            // Convertimos clave e IV a bytes
            byte[] keyBytes = Encoding.UTF8.GetBytes(strKey);
            byte[] ivBytes = Encoding.UTF8.GetBytes(strIV);
            if (keyBytes.Length != 32 || ivBytes.Length != 16)
            {
                throw new InvalidOperationException(
                    "Falta configurar Security:EncryptionKey (32 caracteres) y Security:EncryptionIV (16 caracteres). " +
                    "Defínelos con user-secrets o variables de entorno (Security__EncryptionKey y Security__EncryptionIV).");
            }

            using Aes aes = Aes.Create();
            aes.KeySize = 256;
            aes.BlockSize = 128;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;
            aes.Key = keyBytes;
            aes.IV = ivBytes;

            ICryptoTransform transform = (modo == 1)
                ? aes.CreateEncryptor()
                : aes.CreateDecryptor();

            using MemoryStream memStream = new();
            using CryptoStream cryptoStream = new(memStream, transform, CryptoStreamMode.Write);
            cryptoStream.Write(dataBytes, 0, dataBytes.Length);
            cryptoStream.FlushFinalBlock();

            byte[] resultBytes = memStream.ToArray();

            return (modo == 1)
                ? Convert.ToBase64String(resultBytes) // cifrado → Base64
                : Encoding.UTF8.GetString(resultBytes); // descifrado → texto original
        }
    }
}
