import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, "../.env");

dotenv.config({
  path: envPath,
  override: false,
  quiet: true,
});

const { default: app } = await import("./app.js");

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`[server] Servidor escuchando en http://localhost:${port}`);
});
