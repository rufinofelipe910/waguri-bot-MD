import { printBanner } from "./core/logger.js";
import { createConnection } from "./core/connection.js";
import { loadPlugins, watchPlugins } from "./core/pluginLoader.js";
import { log } from "./core/logger.js";
import { launchAllSubbots, registerMainBot } from "./core/subbotManager.js";
import fs from "fs";
import path from "path";

process.removeAllListeners("warning");

// ─── LIMPIAR TMP AL INICIAR ───────────────────────────────
const tmpDir = "./tmp";
if (fs.existsSync(tmpDir)) {
  for (const file of fs.readdirSync(tmpDir)) {
    try { fs.unlinkSync(path.join(tmpDir, file)) } catch {}
  }
}

// ─── LIMPIEZA PERIÓDICA CADA 6 HORAS ─────────────────────
setInterval(() => {
  if (!fs.existsSync(tmpDir)) return;
  for (const file of fs.readdirSync(tmpDir)) {
    try {
      const filePath = path.join(tmpDir, file);
      const stat = fs.statSync(filePath);
      if (Date.now() - stat.mtimeMs > 3600000) {
        fs.unlinkSync(filePath);
      }
    } catch {}
  }
  if (global.gc) global.gc();
}, 6 * 60 * 60 * 1000);

async function main() {
  await printBanner();

  log.info("Cargando plugins...");
  await loadPlugins();
  watchPlugins();

  log.info("Iniciando bot principal...");
  const sock = await createConnection({
    sessionDir: "./sessions/main",
    botLabel: "MAIN",
    isSubbot: false,
  });

  if (sock) registerMainBot(sock, "MAIN");

  // ─── Relanzar subbots existentes ─────────────────────
  launchAllSubbots();
}

main().catch((e) => {
  log.error(`Error fatal: ${e.message}`);
  process.exit(1);
});