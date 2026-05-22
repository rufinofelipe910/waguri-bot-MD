import { workerData, parentPort } from "worker_threads";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import pino from "pino";
import { mkdir } from "fs/promises";
import { handleMessage } from "./messageHandler.js";
import { loadPlugins } from "./pluginLoader.js";

const { id, sessionDir, phoneNumber } = workerData;
const logger = pino({ level: "silent" });

async function startWorker(_attempt = 0) {
  await mkdir(sessionDir, { recursive: true });
  await loadPlugins();

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const useCode = !!phoneNumber && !state.creds.registered;

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: false,
    logger,
    browser: ["MacOs", "Safari"],
    syncFullHistory: false,
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: false,
    getMessage: async () => undefined,
    connectTimeoutMs: 30000,
    keepAliveIntervalMs: 55000,
    retryRequestDelayMs: 2000,
    defaultQueryTimeoutMs: undefined,
  });

  // ─── PEDIR CÓDIGO ──────────────────────────────────────
  if (useCode) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      let code = await sock.requestPairingCode(phoneNumber.replace(/\D/g, ""));
      code = code?.match(/.{1,4}/g)?.join("-") || code;
      parentPort.postMessage({ type: "code", code });
    } catch (e) {
      parentPort.postMessage({ type: "error", message: e.message });
    }
  }

  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      parentPort.postMessage({
        type: "status",
        status: "online",
        jid: sock.user?.id || "",
      });
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;

      parentPort.postMessage({ type: "status", status: "offline", jid: "" });

      if (statusCode === DisconnectReason.loggedOut) {
        parentPort.postMessage({ type: "logged_out" });
        process.exit(0);
        return;
      }

      if (statusCode === DisconnectReason.connectionReplaced) {
        process.exit(0);
        return;
      }

      // Reconectar
      setTimeout(() => startWorker(_attempt + 1), 5000);
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      if (!msg.message) continue;
      if (msg.key?.remoteJid === "status@broadcast") continue;
      handleMessage(sock, msg, id.toUpperCase()).catch(() => {});
    }
  });
}

startWorker().catch((e) => {
  parentPort?.postMessage({ type: "error", message: e.message });
  process.exit(1);
});