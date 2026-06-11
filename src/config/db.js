import dotenv from "dotenv";
import pg from "pg";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// DB.JS: CARGA LA CONFIGURACION DEL .ENV Y ABRE LA CONEXION A POSTGRES.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, "../../.env");

dotenv.config({
  path: envPath,
  override: false,
  quiet: true,
});

const { Pool } = pg;
const sslEnabled = String(process.env.DB_SSL || "").toLowerCase() === "true";

const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 5000),
  ...(sslEnabled ? { ssl: { rejectUnauthorized: false } } : {}),
};

// POOL COMPARTIDO: LO USA TODA LA API PARA CONSULTAR LA BASE DE DATOS.
export const pool = new Pool(dbConfig);

// PRUEBA RAPIDA: VERIFICA QUE POSTGRES RESPONDE CORRECTAMENTE.
export async function testDbConnection() {
  console.log("[db] Configuracion cargada:", {
    envFile: envPath,
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    password: dbConfig.password ? "[hidden]" : undefined,
    ssl: sslEnabled,
  });

  const result = await pool.query("SELECT NOW() AS server_time");
  console.log("[db] Conexion OK:", result.rows[0]);

  return result.rows[0];
}

export default pool;
