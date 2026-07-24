# Sistema y configuracion para proyecto plantas con IA

Sistema desarrollado con:
- React - JS
- Node.js - Express
- PostgreSQL 
- JWT
- modulos ESP-NOW
- Modelo Ramdon Forest Inteligencia Artificial

## Características

- Inicio de sesión
- Gestión de usuarios
- Gestión de roles
- Gestion de Estado de Hadware
- Parametrizacion de cultivo
- Gestion de informes
- Gestion de alertas
- Control Manual
- Reentrenamiento de IA
- Gestion de auditoria
- Modulo de soporte

## Instalación

Clonar el proyecto

```bash
git clone https://github.com/usuario/proyecto.git
```

Instalar dependencias

Backend

```bash
npm install
```

Frontend

```bash
npm install
```

Base de datos

## Instalación

1. Crear una base de datos vacía.

```sql
CREATE DATABASE sistema_gestion;
```

2. Conectarse a la base.

3. Ejecutar

```sql
install.sql
```

El script crea automáticamente:

- Tablas
- Funciones
- Procedimientos
- Triggers
- Datos iniciales

Variables de entorno

Crear un archivo

```
.env
```

con

```
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=

JWT_SECRET=
```

Ejecutar

Backend

```bash
npm run dev
```

Frontend

```bash
npm run dev
```


## Autor

Jasser Castellanos