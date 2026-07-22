import axios from "axios";
import { prepareWAMessageMedia, generateWAMessageFromContent } from "@whiskeysockets/baileys";
import { getPlugins } from "../../core/pluginLoader.js";
import { db } from "../../database/db.js";
import config from "../../config.js";

let bannerCache    = null
let bannerCacheTime = 0
let mediaCache     = null
let mediaCacheTime  = 0
let lastUsedUrl     = null

async function getBuffer(url) {
  try {
    const res = await axios({ method: "get", url, responseType: "arraybuffer" });
    return Buffer.from(res.data);
  } catch (e) {
    throw new Error(`Error descargando imagen: ${e.message}`);
  }
}
async function getBannerBuffer(url) {
  if (bannerCache && lastUsedUrl === url && Date.now() - bannerCacheTime < 3600000) return bannerCache
  bannerCache = await getBuffer(url)
  bannerCacheTime = Date.now()
  lastUsedUrl = url
  return bannerCache
}

const catNombres = {
  "info":     "𝙸𝙽𝙵𝙾",
  "misc":     "𝙼𝙸𝚂𝙲",
  "dl":       "𝙳𝙻",
  "grupos":   "𝙶𝚁𝙾𝚄𝙿",
  "owner":    "𝙾𝚆𝙽𝙴𝚁",
  "utils":    "𝚄𝚃𝙸𝙻𝚂",
  "stickers": "𝚂𝚃𝙸𝙲𝙺𝙴𝚁𝚂",
  "sockets":  "𝚂𝙾𝙲𝙺𝙴𝚃𝚂",
  "ia":       "𝙸𝙰",
  "economy":  "𝙴𝙲𝙾𝙽𝙾𝙼𝚈",
  "anime":    "𝙰𝙽𝙸𝙼𝙴",
}

const catDescripciones = {
  "info":     "彡 Comandos de información.",
  "misc":     "彡 Comandos misc.",
  "dl":       "彡 Comandos de descargas.",
  "grupos":   "彡 Comandos para gestionar grupos.",
  "owner":    "彡 Comandos de owner.",
  "utils":    "彡 Comandos útiles.",
  "stickers": "彡 Comandos para gestionar stickers.",
  "sockets":  "彡 Comandos para subbots.",
  "ia":       "彡 Comandos para inteligencia artificial.",
  "economy":  "彡 Comandos de economía.",
  "anime":    "彡 Comandos de reacciones anime.",
}

export default {
  name: ["menu", "help", "ayuda"],
  description: "Muestra el menú del sistema.",
  category: "info",
  ownerOnly: false,

  async run({ sock, from, senderNum, isGroup, groupName, usedPrefix, msg }) {
    try {
      const lugar = isGroup ? groupName : "Chat Privado";

      const currentBotNum = sock.user?.id ? sock.user.id.split('@')[0].split(':')[0].replace(/\D/g, '') : '';
      const currentBotJid = currentBotNum ? `${currentBotNum}@s.whatsapp.net` : '';

      let botData = db.getBot(currentBotJid) || db.getBot('main');

      const esLabelAutomatico = botData?.label?.startsWith('SUB_') || botData?.label === 'Subbot' || botData?.label === 'MAIN'
      const nombreBot = (esLabelAutomatico || !botData?.label ? config.botName : botData.label).replace(/@\d+/g, '').trim();

      const urlFoto = botData?.banner || "https://n.uguu.se/uZtZRfRv.jpg";

      const esVerdaderoMain = botData?.isMain === true || botData?.isMain === 1;
      const tipoBot = esVerdaderoMain ? "Bot Principal" : "Subbot";

      const linkMatch = "https://mancosyasociados.kesug.com";

      const esOwnerOCoOwner = config.ownerNumber?.includes(senderNum) || config.coOwners?.includes(senderNum)

      const plugins    = getPlugins()
      const categories = {}

      for (const [, plugin] of plugins) {
        const cat = plugin.category || "misc"
        if (cat === "owner" && !esOwnerOCoOwner) continue
        if (!categories[cat]) categories[cat] = new Set()
        const names = Array.isArray(plugin.name) ? plugin.name : [plugin.name]
        categories[cat].add(names[0])
      }

      let textoMenu = `╭─❍ 𝐇𝐨𝐥𝐚 *@${senderNum}* ❍─╮\n`;
      textoMenu += `┃ 彡 Soy "${nombreBot}"\n`;
      textoMenu += `╰────────────╯\n`;
      textoMenu += `╭━━━━━━━━━━━━━━━━━━\n`;
      textoMenu += `│ ➤ 𝚃𝙸𝙿𝙾 : ${tipoBot}\n`;
      textoMenu += `│ ➤ 𝚂𝙸𝚂𝚃𝙴𝙼𝙰 : Android\n`;
      textoMenu += `│ ➤ 𝚄𝚂𝙴𝚁 : @${senderNum}\n`;
      textoMenu += `│ ➤ 𝚄𝚁𝙻 : ${linkMatch}\n`;
      textoMenu += `╰━━━━━━━━━━━━━━━━━━\n\n`;

      for (const [cat, cmds] of Object.entries(categories)) {
        const categoriaLimped = cat.toLowerCase().trim();
        const nombreFormateado = catNombres[categoriaLimped] || categoriaLimped.toUpperCase();
        const descripcion = catDescripciones[categoriaLimped] || "彡 Comandos.";

        textoMenu += `⌈ 𝙎𝙀𝘾𝙏𝙊𝙍 ⌋ *${nombreFormateado}*\n`;
        textoMenu += `${descripcion}\n`;

        for (const cmd of cmds) {
          textoMenu += `  🌈 *${usedPrefix}${cmd}*\n`;
        }

        textoMenu += `\n`;
      }

      textoMenu += `╭━─━─━─━─━─━─━─━╮\n`;
      textoMenu += `  ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝓡𝓮𝔂 𝓡𝓾𝓯𝓲𝓷𝓸 👑\n`;
      textoMenu += `🔗 ${linkMatch}\n`;
      textoMenu += `╰━─━─━─━─━─━─━─━╯`;

      let imgBanner
      if (mediaCache && lastUsedUrl === urlFoto && Date.now() - mediaCacheTime < 3600000) {
        imgBanner = mediaCache
      } else {
        const bufferBanner = await getBannerBuffer(urlFoto)
        const mediaBanner  = await prepareWAMessageMedia(
          { image: bufferBanner },
          { upload: sock.waUploadToServer, mediaTypeOverride: "thumbnail-link" }
        )
        imgBanner      = mediaBanner.imageMessage
        mediaCache     = imgBanner
        mediaCacheTime = Date.now()
      }

      const getTs = (ts) => typeof ts === "object" ? Number(ts.low || ts) : Number(ts);

      const content = {
        extendedTextMessage: {
          endCardTiles: [],
          text: textoMenu,
          matchedText: linkMatch,
          canonicalUrl: linkMatch,
          description: `Powered by 𝓡𝓮𝔂 𝓡𝓾𝓯𝓲𝓷𝓸 👑 | ${nombreBot}`,
          title: nombreBot.toUpperCase(),
          previewType: 0,
          jpegThumbnail: imgBanner.jpegThumbnail,
          thumbnailDirectPath: imgBanner.directPath,
          thumbnailSha256: imgBanner.fileSha256,
          thumbnailEncSha256: imgBanner.fileEncSha256,
          mediaKey: imgBanner.mediaKey,
          mediaKeyTimestamp: getTs(imgBanner.mediaKeyTimestamp),
          thumbnailHeight: imgBanner.height || 1080,
          thumbnailWidth: imgBanner.width || 1920,
          inviteLinkGroupTypeV2: 0,
          contextInfo: {
            mentionedJid: [`${senderNum}@s.whatsapp.net`],
            isForwarded: true,
            forwardingScore: 1,
            forwardedNewsletterMessageInfo: {
              newsletterJid: "120363423258391692@newsletter",
              newsletterName: "ε(´｡•᎑•)っ 𝚆𝚊𝚐𝚞𝚛𝚒 𝙱𝚘𝚝 っ(´｡•᎑•)っ",
              serverMessageId: -1
            }
          }
        }
      };

      const waMsg = generateWAMessageFromContent(from, content, { userJid: sock.user?.id, quoted: msg })
      await sock.relayMessage(from, waMsg.message, { messageId: waMsg.key.id })

    } catch (error) {
      console.error("Error crítico en el comando menu:", error);
    }
  }
};
