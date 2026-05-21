export default {
  // ─── BOT INFO ───────────────────────────────────────────
  botName: "Yuta Okotsu",
  prefix: ".",

  // ─── OWNER ──────────────────────────────────────────────
  ownerNumber: ["573135180876", "50588112827"],  // Tu número con código de país, sin +
  coOwners: [],

  // ─── SESIONES ───────────────────────────────────────────
  sessionDir: "./sessions/main",

  // ─── COMPORTAMIENTO ─────────────────────────────────────
  readMessages: true,
  autoReconnect: true,
  maxReconnectAttempts: 10,
  reconnectDelay: 5000,

  // ─── LOGS ───────────────────────────────────────────────
  logLevel: "info",
};