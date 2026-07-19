import fs from "fs";
import path from "path";

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
  name: Object.keys(DATA),
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

      const authorName = msg.pushName || authorJid.split("@")[0];
      const targetName = mentionedJid 
        ? (contextInfo?.pushName || mentionedJid.split("@")[0])
        : null;

      const caption = isSelf
        ? `${authorName} ${entry.self}`
        : `${authorName} ${entry.target} ${targetName}`;

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
