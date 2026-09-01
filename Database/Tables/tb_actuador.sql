CREATE TABLE IF NOT EXISTS tb_actuador (
    id SERIAL PRIMARY KEY,
    tb_proyecto_id INT NOT NULL REFERENCES tb_proyecto(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    tipo_actuador VARCHAR(50) NOT NULL DEFAULT 'VALVULA',
    estado_actual VARCHAR(20) NOT NULL DEFAULT 'INACTIVO',
    activo_en_low BOOLEAN NOT NULL DEFAULT TRUE,
    duracion_maxima_segundos INT NOT NULL DEFAULT 60,
    sn_activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_registra TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_actuador_estado CHECK(estado_actual IN ('INACTIVO','ACTIVO','DESCONOCIDO')),
    CONSTRAINT ck_actuador_duracion CHECK(duracion_maxima_segundos BETWEEN 1 AND 600)
);

CREATE TABLE IF NOT EXISTS tb_nodo_actuador (
    tb_nodo_id INT NOT NULL REFERENCES tb_nodo_iot(id) ON DELETE CASCADE,
    tb_actuador_id INT NOT NULL REFERENCES tb_actuador(id) ON DELETE CASCADE,
    pin_control INT NOT NULL DEFAULT 5,
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    sn_activo BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY(tb_nodo_id,tb_actuador_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_actuador_nodo_principal
ON tb_nodo_actuador(tb_actuador_id) WHERE es_principal=TRUE AND sn_activo=TRUE;
