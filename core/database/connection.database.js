import pg from 'pg';
import 'dotenv/config';
import fs from 'node:fs';

const { Pool } = pg;

const sslEnabled = String(process.env.DB_SSL || '').toLowerCase() === 'true';
const sslCaPath = process.env.DB_SSL_CA?.trim();
const ssl = sslEnabled
    ? {
        rejectUnauthorized: true,
        ...(sslCaPath ? { ca: fs.readFileSync(sslCaPath, 'utf8') } : {}),
    }
    : undefined;

export const db = new Pool({
    allowExitOnIdle: true,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl,
    connectionTimeoutMillis: 10000,
    max: Number(process.env.DB_POOL_MAX || 10),
});

try {
    await db.query('SELECT 1'); // Test the connection
    console.log('Database connected successfully');
}catch (error) {
    console.error('Error connecting to the database:', error);
    process.exit(1);
}
