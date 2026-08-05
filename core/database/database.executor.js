
import { db } from "./connection.database.js";

export default class DatabaseExecutor {

    static async executeFunction(functionName, params = []) {

        const placeholders = params
            .map((_, i) => `$${i + 1}`)
            .join(", ");

        const sql = `SELECT * FROM ${functionName}(${placeholders})`;

        const result = await db.query(sql, params);

        return result.rows;
    }

    static async executeProcedure(procedureName, params = []) {

        const placeholders = params
            .map((_, i) => `$${i + 1}`)
            .join(", ");

        const sql = `CALL ${procedureName}(${placeholders})`;

        return await db.query(sql, params);
    }

    static async executeProcedureWithResult(procedureName, params = [], resultCast = (rows) => rows[0] ?? null) {

        const placeholders = params
            .map((_, i) => `$${i + 1}`)
            .join(", ");

        const sql = `CALL ${procedureName}(${placeholders})`;

        const result = await db.query(sql, params);

        return resultCast(result.rows);
    }

    static async executeProcedureWithOutParams(procedureName, params = [], resultCast = (rows) => rows[0] ?? null) {
        return await this.executeProcedureWithResult(procedureName, params, resultCast);
    }

}