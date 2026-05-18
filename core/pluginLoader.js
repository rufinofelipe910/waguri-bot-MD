import { readdirSync, statSync, watch } from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { log } from "./logger.js";

const plugins = new Map();
const PLUGINS_DIR = path.resolve("./plugins");

// ─── CARGAR TODOS LOS PLUGINS ─────────────────────────────
export async function loadPlugins() {
  plugins.clear();
  await loadDir(PLUGINS_DIR);
  log.ok(`Plugins cargados: ${plugins.size} comandos`);
}

async function loadDir(dir) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }

  for (const entry of entries) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      await loadDir(full);
    } else if (entry.endsWith(".js")) {
      await loadPlugin(full);
    }
  }
}

async function loadPlugin(filePath) {
  try {
    // Forzar recarga limpia con timestamp para evitar caché
    const url = pathToFileURL(filePath).href + `?t=${Date.now()}`;
    const mod = await import(url);

    if (!mod.default?.name || !mod.default?.run) {
      log.warn(`Plugin sin estructura válida: ${filePath}`);
      return;
    }

    const names = Array.isArray(mod.default.name) ? mod.default.name : [mod.default.name];
    for (const n of names) {
      plugins.set(n.toLowerCase(), mod.default);
    }
  } catch (e) {
    log.error(`Error cargando plugin ${filePath}: ${e.message}`);
  }
}

// ─── HOT RELOAD ───────────────────────────────────────────
export function watchPlugins() {
  watch(PLUGINS_DIR, { recursive: true }, async (event, filename) => {
    if (!filename?.endsWith(".js")) return;
    const full = path.join(PLUGINS_DIR, filename);
    log.info(`Plugin actualizado: ${filename}`);
    await loadPlugin(full);
  });
  log.info("Hot-reload de plugins activo");
}

export function getPlugins() {
  return plugins;
}