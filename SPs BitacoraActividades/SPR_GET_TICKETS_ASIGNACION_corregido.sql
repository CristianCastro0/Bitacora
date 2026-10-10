ALTER PROCEDURE [dbo].[SPR_GET_TICKETS_ASIGNACION]
AS
BEGIN
    SET NOCOUNT ON;
 
    ;WITH PoolPorRol AS (
        SELECT
            A.TIC_NID, H.ROL_NID, H.HOR_NCANTIDAD, A.ASG_DFECHA_ASIGNADA, A.ESA_NID,
            ROW_NUMBER() OVER (PARTITION BY A.TIC_NID, H.ROL_NID ORDER BY A.ASG_NID DESC) AS RN
        FROM TBL_TASIGNACION A
        INNER JOIN TBL_THORASASIGNADAS H ON H.HOR_NID = A.HOR_NID
    )
    SELECT
        T.TIC_NID AS IdTicket,
        T.TIC_CCODIGO AS CodigoTicket,
        T.TIC_CRESPONSABLE AS Senior,
 
        EC.EstadoId,
        EA.ESA_CNOMBRE AS Estado,
        EC.FechaAsignacion,
 
        Senior.HOR_NCANTIDAD AS HorasSenior,
        Desarrollo.HOR_NCANTIDAD AS HorasDesarrollo,
        Calidad.HOR_NCANTIDAD AS HorasCalidad
 
    FROM TBL_TTICKET T
    LEFT JOIN PoolPorRol Senior ON Senior.TIC_NID = T.TIC_NID AND Senior.ROL_NID = 2 AND Senior.RN = 1
    LEFT JOIN PoolPorRol Desarrollo ON Desarrollo.TIC_NID = T.TIC_NID AND Desarrollo.ROL_NID = 3 AND Desarrollo.RN = 1
    LEFT JOIN PoolPorRol Calidad ON Calidad.TIC_NID = T.TIC_NID AND Calidad.ROL_NID = 4 AND Calidad.RN = 1
    -- Se calcula EstadoId y FechaAsignacion UNA sola vez aquí (en vez
    -- de repetir el mismo CASE varias veces en el SELECT), y se
    -- reutiliza abajo para buscar el nombre del estado.
    CROSS APPLY (
        SELECT
            CASE
                WHEN Desarrollo.HOR_NCANTIDAD IS NULL OR Calidad.HOR_NCANTIDAD IS NULL THEN 4  -- Por Asignar: falta alguno de los dos
                WHEN Desarrollo.ESA_NID = 3 OR Calidad.ESA_NID = 3 THEN 3                       -- Agotado: ambos existen, pero a alguno ya se le acabaron las horas
                ELSE 1                                                                          -- Asignado: ambos existen y ninguno está agotado
            END AS EstadoId,
            CASE
                WHEN Desarrollo.HOR_NCANTIDAD IS NOT NULL AND Calidad.HOR_NCANTIDAD IS NOT NULL
                THEN (SELECT MAX(f) FROM (VALUES (Desarrollo.ASG_DFECHA_ASIGNADA), (Calidad.ASG_DFECHA_ASIGNADA)) AS Fechas(f))
                ELSE NULL
            END AS FechaAsignacion
    ) EC
    LEFT JOIN TBL_RESTADOASIGNACION EA ON EA.ESA_NID = EC.EstadoId
 
    WHERE T.EST_NID <> 2
    ORDER BY T.TIC_NID DESC
END