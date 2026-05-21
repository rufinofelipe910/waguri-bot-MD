import { proto, generateWAMessageFromContent } from "@whiskeysockets/baileys";

export default {
  name: ["menu", "help", "ayuda"],
  description: "Muestra el menú estético con link preview",
  ownerOnly: false,

  async run({ sock, from, senderNum, isGroup, groupName, usedPrefix, react, msg }) {
    try {
      await react("⛩️");

      const hora = new Date().toLocaleTimeString("es-CO", { hour12: false });
      const fecha = new Date().toLocaleDateString("es-CO");
      const lugar = isGroup ? groupName : "Chat Privado";

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
      textoMenu += `✦ ${usedPrefix}ping ➔ _Verifica la latencia del bot_\n\n`;

      textoMenu += `👥 ─── ❖ *GESTIÓN GRUPOS* ❖ ─── 👥\n`;
      textoMenu += `✦ ${usedPrefix}tag ➔ _Mención flash a todos los miembros_\n\n`;

      textoMenu += `👑 ─── ❖ *PROPIETARIO / OWNER* ❖ ─── 👑\n`;
      textoMenu += `✦ ${usedPrefix}eval ➔ _Ejecutor de código en vivo_\n`;
      textoMenu += `✦ ${usedPrefix}update ➔ _Sincronización forzada con GitHub_\n\n`;

      textoMenu += `🔺 _Powered by DuarteXV | Yuta Okotsu MD_ 🔺`;

      const urlFoto = "https://raw.githubusercontent.com/DuarteXV/Yotsuba-MD-Premium/main/uploads/81af45f44481e159.jpg";

      const waMsg = generateWAMessageFromContent(
        from,
        {
          extendedTextMessage: proto.Message.ExtendedTextMessage.fromObject({
            text: textoMenu,
            canonicalUrl: urlFoto,
            matchedText: urlFoto,
            jpegThumbnail: null,
            thumbnailWidth: 400,
            thumbnailHeight: 180,
            previewType: 0,
            title: "⚔️ Yuta Okotsu System",
            description: "El Hechicero de Grado Especial",
            renderLargerThumbnail: true,
          })
        },
        {
          userJid: sock.user?.id,
          quoted: msg
        }
      );

      await sock.relayMessage(from, waMsg.message, { messageId: waMsg.key.id });

    } catch (error) {
      console.error("Error en menu:", error);
    }
  }
};