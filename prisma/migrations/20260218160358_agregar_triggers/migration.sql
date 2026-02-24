-- 1. Respaldo de Inventario (Antes de actualizar unidad o encargado)
CREATE OR REPLACE FUNCTION trg_respaldo_inventario_auto()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO "Historial_Registro_Automovil" (
        "Consecutivo", "Placa", "Marca", "Modelo", "Color", "Linea", "Email_Personal"
    )
    VALUES (
        OLD."Consecutivo", OLD."Placa", OLD."Marca", OLD."Modelo", OLD."Color", OLD."Linea", OLD."Email_encargado"
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER disparador_respaldo_unidad
BEFORE UPDATE ON "Inventario_Automoviles"
FOR EACH ROW
EXECUTE FUNCTION trg_respaldo_inventario_auto();

-- 2. Respaldo de Empleados (Trayectoria completa)
CREATE OR REPLACE FUNCTION trg_respaldo_empleados()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO "Historial_Empleados" ("Email_Empleado", "Nombre", "A_Paterno", "A_Materno", "Cargo", "Departamento")
    VALUES (OLD."Email", OLD."Nombre_Empleado", OLD."A_Paterno", OLD."A_Materno", OLD."Cargo", OLD."Departamento");
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER disparador_respaldo_empleado
BEFORE UPDATE ON "Empleados"
FOR EACH ROW
EXECUTE FUNCTION trg_respaldo_empleados();

-- 3. Generacion de Folio Automatico (Ticket)
CREATE OR REPLACE FUNCTION generar_folio_ticket()
RETURNS TRIGGER AS $$
DECLARE
    v_fecha_formato VARCHAR(6);
    v_placa_actual VARCHAR(10);
BEGIN
    -- Buscar placa en inventario
    SELECT "Placa" INTO v_placa_actual FROM "Inventario_Automoviles" WHERE "Consecutivo" = NEW."Consecutivo";
    
    IF NOT FOUND THEN 
        RAISE EXCEPTION 'La unidad % no existe.', NEW."Consecutivo"; 
    END IF;

    -- Generar Folio (Consecutivo + DDMMYY)
    v_fecha_formato := TO_CHAR(COALESCE(NEW."Fecha_Realizacion", CURRENT_DATE), 'DDMMYY');
    NEW."Pk_folio_ticket" := NEW."Consecutivo" || v_fecha_formato;

    -- Insertar automaticamente en el historial del auto (Bitacora)
    INSERT INTO "Historial_Auto" ("Consecutivo", "Placa_Actual", "Kilometraje", "Descripcion")
    VALUES (NEW."Consecutivo", v_placa_actual, NEW."Kilometraje", NEW."Descripcion");

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generar_folio
BEFORE INSERT ON "Solicitud"
FOR EACH ROW
EXECUTE FUNCTION generar_folio_ticket();