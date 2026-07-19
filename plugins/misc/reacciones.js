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
  groupOnly: true,

  async run({ sock, from, msg, sender, reply, react, cmdName }) {
    try {
      const category = (cmdName || "").toLowerCase();
      const entry = DATA[category];
      if (!entry) return;

      const contextInfo = msg?.message?.extendedTextMessage?.contextInfo;
      
      let who = sender;
      if (contextInfo?.mentionedJid?.length > 0) {
        who = contextInfo.mentionedJid[0];
      } else if (contextInfo?.participant) {
        who = contextInfo.participant;
      }

      if (who.endsWith('@lid') || isNaN(who.split('@')[0])) {
        try {
          const groupMeta = await sock.groupMetadata(from);
          const found = groupMeta.participants.find(p => p.id === who || p.lid === who);
          if (found?.jid) who = found.jid;
        } catch {}
      }

      const authorJid = cleanJid(sender);
      const mentionedJid = cleanJid(who);
      const isSelf = mentionedJid === authorJid;

      const video = entry.videos[Math.floor(Math.random() * entry.videos.length)];

      const authorName = msg.pushName || authorJid.split("@")[0];
      const targetName = isSelf 
        ? null 
        : (contextInfo?.pushName || mentionedJid.split("@")[0]);

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
