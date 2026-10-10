import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const args = {};
for (let index = 2; index < process.argv.length; index += 1) {
    const value = process.argv[index];
    if (!value.startsWith("--")) continue;
    args[value.slice(2)] = process.argv[index + 1];
    index += 1;
}

if (!args.input) throw new Error("Falta --input con el archivo exportado.");

const coreDir = path.resolve(args.core || "core");
const envPath = path.resolve(args.env || path.join(coreDir, ".env"));
const requireFromCore = createRequire(path.join(coreDir, "package.json"));
const pg = requireFromCore("pg");
const dotenv = requireFromCore("dotenv");

dotenv.config({ path: envPath });

const quoteIdentifier = (value) => `"${String(value).replaceAll('"', '""')}"`;
const payload = JSON.parse(await fs.readFile(path.resolve(args.input), "utf8"), (_key, value) => {
    if (value?.__nodalviaType === "buffer") return Buffer.from(value.value, "base64");
    if (value?.__nodalviaType === "bigint") return value.value;
    return value;
});

if (payload.format !== "nodalvia-postgres-data-v1" || !Array.isArray(payload.tables)) {
    throw new Error("El archivo no tiene el formato de exportación de Nodalvia.");
}

const pool = new pg.Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: String(process.env.DB_SSL || "").toLowerCase() === "true"
        ? { rejectUnauthorized: true, ca: await fs.readFile(process.env.DB_SSL_CA, "utf8") }
        : undefined,
    connectionTimeoutMillis: 10000,
});

const client = await pool.connect();
try {
    await client.query("BEGIN");
    await client.query("SET LOCAL session_replication_role = replica");

    const existingResult = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    const existingTables = new Set(existingResult.rows.map(({ table_name }) => table_name));
    const missingTables = payload.tables
        .map(({ name }) => name)
        .filter((name) => !existingTables.has(name));
    if (missingTables.length) {
        throw new Error(`Faltan tablas en el destino: ${missingTables.join(", ")}`);
    }

    const truncateList = payload.tables.map(({ name }) => quoteIdentifier(name)).join(", ");
    await client.query(`TRUNCATE TABLE ${truncateList} RESTART IDENTITY CASCADE`);

    let importedRows = 0;
    for (const table of payload.tables) {
        const destinationColumns = await client.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = $1
        `, [table.name]);
        const allowedColumns = new Set(destinationColumns.rows.map(({ column_name }) => column_name));
        const missingColumns = table.columns.filter((column) => !allowedColumns.has(column));
        if (missingColumns.length) {
            throw new Error(`Faltan columnas en ${table.name}: ${missingColumns.join(", ")}`);
        }

        const columnList = table.columns.map(quoteIdentifier).join(", ");
        const placeholders = table.columns.map((_column, index) => `$${index + 1}`).join(", ");
        const statement = `INSERT INTO ${quoteIdentifier(table.name)} (${columnList}) VALUES (${placeholders})`;
        for (const row of table.rows) {
            await client.query(statement, table.columns.map((column) => row[column]));
            importedRows += 1;
        }
    }

    const sequences = await client.query(`
        SELECT table_name, column_name,
               pg_get_serial_sequence(format('%I.%I', table_schema, table_name), column_name) AS sequence_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND column_default LIKE 'nextval(%'
    `);
    for (const sequence of sequences.rows) {
        if (!sequence.sequence_name) continue;
        const maximum = await client.query(
            `SELECT MAX(${quoteIdentifier(sequence.column_name)}) AS value FROM ${quoteIdentifier(sequence.table_name)}`,
        );
        const value = maximum.rows[0].value;
        await client.query(
            "SELECT setval($1::regclass, $2::bigint, $3::boolean)",
            [sequence.sequence_name, value ?? 1, value !== null],
        );
    }

    await client.query("COMMIT");
    console.log(JSON.stringify({ tables: payload.tables.length, rows: importedRows }));
} catch (error) {
    await client.query("ROLLBACK");
    throw error;
} finally {
    client.release();
    await pool.end();
}
