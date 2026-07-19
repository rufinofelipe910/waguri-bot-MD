import fs from "fs";
import path from "path";

const DATA_PATH = path.resolve(process.cwd(), "database/anime.json");
const DATA = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));

// Quita el sufijo ":device" y limpia el JID
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

      // Si Baileys no da pushName, agarramos el número limpio sin @ ni nada
      const authorName = msg.pushName || authorJid.split("@")[0];
      
      // Para el mencionado, intentamos sacar el pushName que a veces viene en el contextInfo.
      // Si viene vacío, dejamos el número limpio (sin @)
      const targetName = mentionedJid 
        ? (contextInfo?.pushName ||劇 mentionedJid.split("@")[0])
        : null;

      // Formato exacto con comillas invertidas y sin @
      const caption = isSelf
        ? `\`${authorName}\` ${entry.self}`
        : `\`${authorName}\` ${entry.target} \`${targetName}\``;

      // El array de mentions se queda igual para que funcione la notificación en segundo plano
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
