import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ESTE ARCHIVO ARRANCA LA APLICACION Y LLAMA src/app.js.
// AQUI SE CARGA .ENV Y SE ABRE EL PUERTO.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, "../.env");

dotenv.config({
  path: envPath,
  override: false,
  quiet: true,
});

const { default: app } = await import("./app.js");

// PUERTO DONDE ESCUCHA LA API.
const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`[server] Servidor escuchando en http://localhost:${port}`);
});
