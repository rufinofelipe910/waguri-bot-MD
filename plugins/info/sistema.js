import os from "os";
import process from "process";

export default {
  name: ["system", "sys", "stats"],
  description: "Muestra el estado del sistema del bot",
  category: "info",
  ownerOnly: false,

  async run({ sock, from, usedPrefix, react, msg }) {
    try {
      await react("🖥️");

      // ── RAM ──────────────────────────────────
      const ramTotal = os.totalmem();
      const ramLibre  = os.freemem();
      const ramUsada  = ramTotal - ramLibre;
      const ramBot    = process.memoryUsage().heapUsed;

      const toMB = (b) => (b / 1024 / 1024).toFixed(2);
      const pct  = ((ramUsada / ramTotal) * 100).toFixed(1);

      // ── CPU ──────────────────────────────────
      const cpus     = os.cpus();
      const cpuModel = cpus[0]?.model?.trim() || "Desconocido";
      const cpuCores = cpus.length;

      // ── Uptime ───────────────────────────────
      const uptimeSys = os.uptime();
      const uptimeBot = process.uptime();

      const formatTime = (s) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = Math.floor(s % 60);
        return `${h}h ${m}m ${sec}s`;
      };

      // ── Node ─────────────────────────────────
      const nodeVer    = process.version;
      const plataforma = os.platform();
      const arch       = os.arch();

      let text = "";
      text += `🖥️ *SISTEMA — YUTA OKOTSU* 🖥️\n\n`;

      text += `⚡ ─── ❖ *CPU* ❖ ─── ⚡\n`;
      text += `  ✦ *Modelo:* ${cpuModel}\n`;
      text += `  ✦ *Núcleos:* ${cpuCores}\n`;
      text += `  ✦ *Plataforma:* ${plataforma} (${arch})\n\n`;

      text += `🧠 ─── ❖ *MEMORIA RAM* ❖ ─── 🧠\n`;
      text += `  ✦ *Total:* ${toMB(ramTotal)} MB\n`;
      text += `  ✦ *Usada:* ${toMB(ramUsada)} MB (${pct}%)\n`;
      text += `  ✦ *Libre:* ${toMB(ramLibre)} MB\n`;
      text += `  ✦ *Bot usa:* ${toMB(ramBot)} MB\n\n`;

      text += `⏱️ ─── ❖ *UPTIME* ❖ ─── ⏱️\n`;
      text += `  ✦ *Bot activo:* ${formatTime(uptimeBot)}\n`;
      text += `  ✦ *Servidor:* ${formatTime(uptimeSys)}\n\n`;

      text += `🔧 ─── ❖ *ENTORNO* ❖ ─── 🔧\n`;
      text += `  ✦ *Node.js:* ${nodeVer}\n`;
      text += `  ✦ *PID:* ${process.pid}\n\n`;

      text += `🔺 _Powered by DuarteXV | Yuta Okotsu MD_ 🔺`;

      await sock.sendMessage(from, {
        text,
      }, { quoted: msg });

    } catch (error) {
      console.error("Error en system:", error);
    }
  }
};