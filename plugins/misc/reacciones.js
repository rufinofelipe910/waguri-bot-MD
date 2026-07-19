import fs from "fs";
import path from "path";

const DATA_PATH = path.resolve(process.cwd(), "database/anime.json");
const DATA = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));

export default {
  name: Object.keys(DATA), // hug, kiss, pat, slap, cuddle, etc.
  description: "Reacciones anime: .hug @user, .kiss @user, etc.",
  category: "diversion",
  adminOnly: false,
  groupOnly: false,

  // ⚠️ Asumo que tu loader pasa `command` (el alias que activó el plugin).
  // Si tu framework lo llama distinto, ajusta esta línea.
  async run({ sock, from, msg, sender, reply, react, cmdName }) {
    try {
      const category = (cmdName || "").toLowerCase();
      const entry = DATA[category];
      if (!entry) return;

      const mentionedJid =
        msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
        msg?.message?.extendedTextMessage?.contextInfo?.participant ||
        null;

      const authorJid = sender;
      const isSelf = !mentionedJid || mentionedJid === authorJid;

      const video = entry.videos[Math.floor(Math.random() * entry.videos.length)];
      const authorTag = `@${authorJid.split("@")[0]}`;
      const targetTag = mentionedJid ? `@${mentionedJid.split("@")[0]}` : null;

      const caption = isSelf
        ? `⛧ ${authorTag} ${entry.self} 🥹`
        : `⛧ ${authorTag} ${entry.target} ${targetTag} 💞`;

      const mentions = isSelf ? [authorJid] : [authorJid, mentionedJid];

      await react("💫");

      await sock.sendMessage(
        from,
        { video: { url: video }, caption, mentions },
        { quoted: msg }
      );

      await react("✅");
    } catch (e) {
      console.error(e);
      await react("❌");
      await reply({ text: `Failed` });
    }
  },
};
