CREATE TABLE IF NOT EXISTS tb_proyecto_cultivo (
    id SERIAL PRIMARY KEY,
    tb_proyecto_id INT NOT NULL UNIQUE REFERENCES tb_proyecto(id),
    tb_cultivo_id INT NOT NULL REFERENCES tb_cultivo(id),
    variedad VARCHAR(100),
    fecha_siembra DATE,
    tiempo_cosecha_dias INT,
    humedad_suelo_minima DECIMAL(6,2),
    humedad_suelo_maxima DECIMAL(6,2),
    temperatura_minima DECIMAL(6,2),
    temperatura_maxima DECIMAL(6,2),
    observaciones VARCHAR(500),
    cod_usuario_registro INT NOT NULL REFERENCES tb_usuario(id),
    fecha_registra TIMESTAMP NOT NULL DEFAULT NOW(),
    cod_usuario_modifica INT REFERENCES tb_usuario(id),
    fecha_modifica TIMESTAMP,
    CONSTRAINT ck_proyecto_cultivo_humedad CHECK (
        humedad_suelo_minima IS NULL OR humedad_suelo_maxima IS NULL
        OR humedad_suelo_minima <= humedad_suelo_maxima
    ),
    CONSTRAINT ck_proyecto_cultivo_temperatura CHECK (
        temperatura_minima IS NULL OR temperatura_maxima IS NULL
        OR temperatura_minima <= temperatura_maxima
    )
);
