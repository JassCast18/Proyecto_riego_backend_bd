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

const coreDir = path.resolve(args.core || "core");
const outputPath = path.resolve(args.output || "nodalvia-data-export.json");
const envPath = path.resolve(args.env || path.join(coreDir, ".env"));
const requireFromCore = createRequire(path.join(coreDir, "package.json"));
const pg = requireFromCore("pg");
const dotenv = requireFromCore("dotenv");

dotenv.config({ path: envPath });

const quoteIdentifier = (value) => `"${String(value).replaceAll('"', '""')}"`;
const pool = new pg.Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionTimeoutMillis: 10000,
});

function jsonReplacer(_key, value) {
    if (value?.type === "Buffer" && Array.isArray(value.data)) {
        return { __nodalviaType: "buffer", value: Buffer.from(value.data).toString("base64") };
    }
    if (typeof value === "bigint") {
        return { __nodalviaType: "bigint", value: value.toString() };
    }
    return value;
}

try {
    const tableResult = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
    `);

    const tables = [];
    for (const { table_name: tableName } of tableResult.rows) {
        const columnResult = await pool.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = $1
            ORDER BY ordinal_position
        `, [tableName]);
        const columns = columnResult.rows.map(({ column_name }) => column_name);
        const columnList = columns.map(quoteIdentifier).join(", ");
        const rows = (await pool.query(
            `SELECT ${columnList} FROM ${quoteIdentifier(tableName)}`,
        )).rows;
        tables.push({ name: tableName, columns, rows });
    }

    const payload = {
        format: "nodalvia-postgres-data-v1",
        exportedAt: new Date().toISOString(),
        database: process.env.DB_NAME,
        tables,
    };
    await fs.writeFile(outputPath, JSON.stringify(payload, jsonReplacer));

    const rowCount = tables.reduce((total, table) => total + table.rows.length, 0);
    console.log(JSON.stringify({ outputPath, tables: tables.length, rows: rowCount }));
} finally {
    await pool.end();
}
