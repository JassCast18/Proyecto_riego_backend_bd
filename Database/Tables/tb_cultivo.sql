CREATE TABLE IF NOT EXISTS tb_cultivo (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    sn_activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_tb_cultivo_nombre UNIQUE (nombre)
);

INSERT INTO tb_cultivo (nombre)
VALUES ('Maíz'), ('Frijol'), ('Tomate'), ('Café'), ('Chile'), ('Otro')
ON CONFLICT (nombre) DO NOTHING;
