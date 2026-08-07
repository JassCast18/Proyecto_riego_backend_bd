CREATE TABLE IF NOT EXISTS tb_proyecto (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(300),
    sn_activo BOOLEAN NOT NULL DEFAULT TRUE,
    cod_usuario_registro INT NOT NULL REFERENCES tb_usuario(id),
    fecha_registra TIMESTAMP NOT NULL DEFAULT NOW(),
    cod_usuario_modifica INT REFERENCES tb_usuario(id),
    fecha_modifica TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tb_proyecto_nombre_propietario
ON tb_proyecto (cod_usuario_registro, lower(nombre));
