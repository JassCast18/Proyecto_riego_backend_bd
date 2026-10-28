import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function loadDatabasePasswordFromSecretsManager() {
    const secretId = process.env.DB_SECRET_ARN?.trim();
    if (!secretId) return false;

    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-2";
    const awsCli = process.env.AWS_CLI_PATH || "/usr/local/bin/aws";
    const { stdout } = await execFileAsync(awsCli, [
        "secretsmanager",
        "get-secret-value",
        "--secret-id",
        secretId,
        "--region",
        region,
        "--query",
        "SecretString",
        "--output",
        "text",
    ], { timeout: 15000, maxBuffer: 1024 * 1024 });

    const secret = JSON.parse(stdout);
    if (typeof secret.password !== "string" || !secret.password) {
        throw new Error("El secreto administrado de RDS no contiene una contraseña válida.");
    }

    process.env.DB_PASSWORD = secret.password;
    return true;
}
