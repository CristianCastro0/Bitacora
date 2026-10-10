-- =============================================================================
-- SPR_IU_TICKETS (versión corregida)
--
-- Inserta o actualiza un ticket que llega desde el archivo CSV y DEVUELVE su id
-- (TIC_NID) como un único valor.
--
-- Motivo del cambio: la API lee el resultado con ExecuteScalarAsync<long>. Si el
-- procedimiento no devuelve nada, ese valor llega como 0 y la autoasignación del
-- Senior durante la carga del CSV (AutoasignarSeniorSiAplica, que exige
-- idTicket > 0) nunca se ejecuta: el Senior responsable de cada ticket (columna
-- assigned_to del CSV) no queda asignado automáticamente al cargar el archivo.
-- La lógica de inserción y actualización es la misma de la versión anterior.
-- =============================================================================
CREATE OR ALTER PROCEDURE [dbo].[SPR_IU_TICKETS]
    @PI_TIPO BIGINT,
    @PI_CODIGO VARCHAR(50),
    @PI_DESCRIPCION VARCHAR(500),
    @PI_FECHA DATETIME,
    @PI_RESPONSABLE VARCHAR(100) = NULL,
    @PI_FECHA_SINCRONIZACION DATETIME
AS
BEGIN

    SET NOCOUNT ON;

    IF EXISTS(
        SELECT 1
        FROM TBL_TTICKET
        WHERE TIC_CCODIGO = @PI_CODIGO
    )
    BEGIN
        UPDATE TBL_TTICKET
        SET
            TIC_CRESPONSABLE = @PI_RESPONSABLE,
            TIC_CDESCRIPCION = @PI_DESCRIPCION,
            TIC_DULTIMA_SINCRONIZACION = @PI_FECHA_SINCRONIZACION
        WHERE TIC_CCODIGO = @PI_CODIGO
    END
    ELSE
    BEGIN
        INSERT INTO TBL_TTICKET
        (
            TIP_NID,
            TIC_CCODIGO,
            TIC_CDESCRIPCION,
            TIC_DFECHA_CREACION,
            EST_NID,
            TIC_CRESPONSABLE,
            TIC_DULTIMA_SINCRONIZACION,
            ETA_NID
        )
        VALUES
        (
            @PI_TIPO,
            @PI_CODIGO,
            @PI_DESCRIPCION,
            @PI_FECHA,
            1,
            @PI_RESPONSABLE,
            @PI_FECHA_SINCRONIZACION,
            1
        )
    END

    -- Id del ticket (nuevo o ya existente): lo usa la API para autoasignar al Senior.
    SELECT TOP (1) TIC_NID
    FROM TBL_TTICKET
    WHERE TIC_CCODIGO = @PI_CODIGO
    ORDER BY TIC_NID

END
