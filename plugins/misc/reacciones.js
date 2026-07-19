import fs from "fs";
import path from "path";
// Importa tu base de datos (ajusta la ruta según tu estructura de carpetas)
import { db } from "../database/db.js"; 

const DATA_PATH = path.resolve(process.cwd(), "database/anime.json");
const DATA = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));

function cleanJid(jid = "") {
  if (!jid) return "";
  const atIndex = jid.lastIndexOf("@");
  if (atIndex === -1) return jid.split(":")[0];
  const userPart = jid.slice(0, atIndex).split(":")[0];
  const domainPart = jid.slice(atIndex + 1);
  return `${userPart}@${domainPart}`;
}

export default {
  name: Object.keys(DATA), // hug, kiss, pat, slap, cuddle, etc.
  description: "Reacciones anime: .hug @user, .kiss @user, etc.",
  category: "diversion",
  adminOnly: false,
  groupOnly: false,

  async run({ sock, from, msg, sender, reply, react, cmdName }) {
    try {
      const category = (cmdName || "").toLowerCase();
      const entry = DATA[category];
      if (!entry) return;

      const contextInfo = msg?.message?.extendedTextMessage?.contextInfo;
      const rawMentioned = contextInfo?.mentionedJid?.[0] || contextInfo?.participant || null;

      const authorJid = cleanJid(sender);
      const mentionedJid = rawMentioned ? cleanJid(rawMentioned) : null;
      const isSelf = !mentionedJid || mentionedJid === authorJid;

      const video = entry.videos[Math.floor(Math.random() * entry.videos.length)];

      // 1. Intentar obtener el nombre del autor (de msg o de la DB)
      const dbAuthor = db.getUser(authorJid);
      const authorName = msg.pushName || dbAuthor.name || dbAuthor.pushName || authorJid.split("@")[0];

      // 2. Intentar obtener el nombre del mencionado desde tu DB
      let targetName = null;
      if (mentionedJid) {
        const dbTarget = db.getUser(mentionedJid);
        // Busca en tu DB si existe 'name' o 'pushName', si no, usa el pushName temporal del contexto o el número limpio
        targetName = dbTarget.name || dbTarget.pushName || contextInfo?.pushName || mentionedJid.split("@")[0];
      }

      // Estructura con las comillas invertidas `` que pides
      const caption = isSelf
        ? `\`${authorName}\` ${entry.self}`
        : `\`${authorName}\` ${entry.target} \`${targetName}\``;

      // Mantenemos las menciones ocultas en el array para que WhatsApp envíe la notificación
      const mentions = isSelf ? [authorJid] : [authorJid, mentionedJid];

      await sock.sendMessage(
        from,
        { video: { url: video }, caption, mentions, gifPlayback: true },
        { quoted: msg }
      );
    } catch (e) {
      console.error(e);
      await react("❌");
      await reply({ text: `Failed` });
    }
  },
};
