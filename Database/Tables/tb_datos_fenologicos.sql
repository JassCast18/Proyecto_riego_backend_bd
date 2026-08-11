
-- =========================================================================
-- Nombre: tb_datos_fenologicos
-- Primary_Key: id
-- Desciprion: infortmacion adicional tomada para alimentacion de la ia
--=========================================================================
DO $$
DECLARE v_exists BOOLEAN; v_has_data BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tb_datos_fenologicos') INTO v_exists;
    IF v_exists THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM tb_datos_fenologicos LIMIT 1)' INTO v_has_data;
        IF NOT v_has_data THEN
            DROP TABLE tb_datos_fenologicos CASCADE;
            v_exists := FALSE;
        END IF;
    END IF;
    IF NOT v_exists THEN
        CREATE TABLE tb_datos_fenologicos (
            id SERIAL PRIMARY KEY,
            tb_informe_id INT REFERENCES tb_informe_supervision(id),
            altura_planta_cm DECIMAL NOT NULL,
            grosor_planta_cm DECIMAL NOT NULL,
            cantidad_hojas INT NOT NULL,
            color_hojas_raw VARCHAR(20) NULL,
            etiqueta_ia_estres INT NULL
        );
    END IF;
END $$;

ALTER TABLE tb_datos_fenologicos ALTER COLUMN altura_planta_cm DROP NOT NULL;
ALTER TABLE tb_datos_fenologicos ALTER COLUMN grosor_planta_cm DROP NOT NULL;
ALTER TABLE tb_datos_fenologicos ALTER COLUMN cantidad_hojas DROP NOT NULL;
