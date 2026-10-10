-- NUEVA (no existía antes): devuelve el ROL_NID real (2=Senior,
-- 3=Desarrollo, 4=Calidad) de una asignación puntual (ASG_NID). Se usa
-- para validar, del lado del backend, que una ampliación se esté
-- guardando en la categoría correcta antes de procesarla (ver
-- RequestGestionarAmpliacion.IdRolEsperado, campo opcional).
CREATE OR ALTER PROCEDURE [dbo].[SPR_GET_ROL_POR_ASIGNACION]
    @PI_IDASIGNACION BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT H.ROL_NID
    FROM TBL_TASIGNACION A
    INNER JOIN TBL_THORASASIGNADAS H ON H.HOR_NID = A.HOR_NID
    WHERE A.ASG_NID = @PI_IDASIGNACION;
END
