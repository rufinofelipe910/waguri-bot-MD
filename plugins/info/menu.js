import axios from "axios";
import { prepareWAMessageMedia, generateWAMessageFromContent } from "@whiskeysockets/baileys";

async function getBuffer(url) {
  try {
    const res = await axios({ method: "get", url, responseType: "arraybuffer" });
    return Buffer.from(res.data);
  } catch (e) {
    throw new Error(`Error descargando imagen: ${e.message}`);
  }
}

export default {
  name: ["menu", "help", "ayuda"],
  description: "Muestra el menú.",
  ownerOnly: false,

  async run({ sock, from, senderNum, isGroup, groupName, usedPrefix, react, msg }) {
    try {
      await react("⛩️");

      const hora  = new Date().toLocaleTimeString("es-CO", { hour12: false });
      const fecha = new Date().toLocaleDateString("es-CO");
      const lugar = isGroup ? groupName : "Chat Privado";

      const urlFoto   = "https://cdn.adoolab.xyz/dl/3d42f230.jpg";
      const linkMatch = "https://mancosyasociados.kesug.com";

      let textoMenu = `✨ ═══ 🫧 *YUTA OKOTSU* 🫧 ═══ ✨\n`;
      textoMenu += `⚔️ _¡El Hechicero de Grado Especial ha despertado!_\n\n`;

      textoMenu += `╔════ 🪐 *INFO DEL SISTEMA* 🪐 ════╗\n`;
      textoMenu += `┃ 👤 *Usuario:* @${senderNum}\n`;
      textoMenu += `┃ 📍 *Canal:* ${lugar}\n`;
      textoMenu += `┃ ⏰ *Hora:* ${hora}\n`;
      textoMenu += `┃ 📅 *Fecha:* ${fecha}\n`;
      textoMenu += `╚════════════════════════╝\n\n`;

      textoMenu += `*📜 LISTA DE COMANDOS* 📜\n`;
      textoMenu += `_Recuerda usar el prefijo [ ${usedPrefix} ] antes de cada orden._\n\n`;

      textoMenu += `🗺️ ─── ❖ *INFORMACIÓN* ❖ ─── 🗺️\n`;
      textoMenu += `✦ ${usedPrefix}menu ➔ _Despliega este menú_\n`;
      textoMenu += `✦ ${usedPrefix}ping ➔ _Verifica la latencia del bot_\n`;
      textoMenu += `✦ ${usedPrefix}system ➔ _Estado del sistema_\n`;
      textoMenu += `✦ ${usedPrefix}bots ➔ _Bots conectados_\n`;
      textoMenu += `✦ ${usedPrefix}lid ➔ _Ver JID de un usuario_\n\n`;

      textoMenu += `🎴 ─── ❖ *MISC* ❖ ─── 🎴\n`;
      textoMenu += `✦ ${usedPrefix}s ➔ _Crear sticker_\n`;
      textoMenu += `✦ ${usedPrefix}setmeta ➔ _Cambiar marca de sticker_\n`;
      textoMenu += `✦ ${usedPrefix}delmeta ➔ _Resetear marca_\n`;
      textoMenu += `✦ ${usedPrefix}cdn ➔ _Subir archivo al CDN_\n`;
      textoMenu += `✦ ${usedPrefix}anime ➔ _Imagen random de anime_\n`;
      textoMenu += `✦ ${usedPrefix}code ➔ _Vincular como subbot_\n`;
      textoMenu += `✦ ${usedPrefix}delbot ➔ _Desvincular subbot_\n\n`;

      textoMenu += `🎵 ─── ❖ *DESCARGAS* ❖ ─── 🎵\n`;
      textoMenu += `✦ ${usedPrefix}scsearch ➔ _Buscar en SoundCloud_\n`;
      textoMenu += `✦ ${usedPrefix}scdl ➔ _Descargar de SoundCloud_\n\n`;

      textoMenu += `👥 ─── ❖ *GRUPOS* ❖ ─── 👥\n`;
      textoMenu += `✦ ${usedPrefix}tag ➔ _Mencionar a todos_\n`;
      textoMenu += `✦ ${usedPrefix}setprimary ➔ _Establecer bot primario_\n`;
      textoMenu += `✦ ${usedPrefix}delprimary ➔ _Quitar bot primario_\n\n`;

      textoMenu += `👑 ─── ❖ *OWNER* ❖ ─── 👑\n`;
      textoMenu += `✦ ${usedPrefix}eval ➔ _Ejecutar código_\n`;
      textoMenu += `✦ ${usedPrefix}r ➔ _Ejecutar shell_\n`;
      textoMenu += `✦ ${usedPrefix}check ➔ _Verificar sistema_\n`;
      textoMenu += `✦ ${usedPrefix}update ➔ _Actualizar bot_\n\n`;

      textoMenu += `🔺 _Powered by DuarteXV | Yuta Okotsu MD_ 🔺\n`;
      textoMenu += `🔗 ${linkMatch}`;

      const bufferBanner = await getBuffer(urlFoto);
      const mediaBanner  = await prepareWAMessageMedia(
        { image: bufferBanner },
        { upload: sock.waUploadToServer, mediaTypeOverride: "thumbnail-link" }
      );
      const imgBanner = mediaBanner.imageMessage;
      const getTs = (ts) => typeof ts === "object" ? Number(ts.low || ts) : Number(ts);

      const content = {
        extendedTextMessage: {
          endCardTiles: [],
          text: textoMenu,
          matchedText: linkMatch,
          canonicalUrl: linkMatch,
          description: "Developed by DuarteXV ❄",
          title: "YUTA OKOTSU",
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
            forwardingScore: 9999,
            forwardedNewsletterMessageInfo: {
              newsletterJid: "120363420979328566@newsletter",
              newsletterName: "⏤͟͞ू⃪𝐁𝕃𝐔𝔼 𝐋𝕆𝐂𝕂 𝐂𝕃𝐔𝔹 𑁯🩵ᰍ",
              serverMessageId: -1
            }
          }
        }
      };

      const waMsg = generateWAMessageFromContent(from, content, { userJid: sock.user?.id })
      await sock.relayMessage(from, waMsg.message, { messageId: waMsg.key.id })

    } catch (error) {
      console.error("Error crítico en el comando menu:", error);
    }
  }
};