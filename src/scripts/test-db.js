import { pool, testDbConnection } from "../config/db.js";

try {
  await testDbConnection();
  process.exitCode = 0;
} catch (error) {
  console.error("[db] Error de conexion:", {
    message: error.message,
    code: error.code,
  });
  process.exitCode = 1;
} finally {
  await pool.end();
}
