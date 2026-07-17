import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`; 

export const db = new Pool({
    allowExitOnIdle: true,
    connectionString
});

try {
    await db.query('SELECT 1'); // Test the connection
    console.log('Database connected successfully');
}catch (error) {
    console.error('Error connecting to the database:', error);
    process.exit(1);
}