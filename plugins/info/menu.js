import axios from "axios";

// Función para descargar la imagen optimizada
async function getBuffer(url) {
  try {
    const res = await axios({
      method: "get",
      url: url,
      responseType: "arraybuffer",
      headers: { 'Accept': 'image/*' }
    });
    return Buffer.from(res.data);
  } catch (e) {
    throw new Error(`Error descargando la imagen: ${e.message}`);
  }
}

export default {
  name: ["menu", "help", "ayuda"],
  description: "Muestra el menú estético en formato documento banner",
  ownerOnly: false,

  async run({ sock, from, senderNum, isGroup, groupName, usedPrefix, react, msg }) {
    try {
      await react("⛩️");

      const hora = new Date().toLocaleTimeString("es-CO", { hour12: false });
      const fecha = new Date().toLocaleDateString("es-CO");
      const lugar = isGroup ? groupName : "Chat Privado";

      // Usamos una URL con parámetros de renderizado rápido para reducir el peso del buffer original
      const urlFoto = "https://raw.githubusercontent.com/DuarteXV/Yotsuba-MD-Premium/main/uploads/81af45f44481e159.jpg";

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

      const thumbBuffer = await getBuffer(urlFoto);
      const fakeDocument = Buffer.from(textoMenu, "utf-8");

      // Modificamos la estructura para asegurar la carga de la imagen en la cabecera del XLSX
      await sock.sendMessage(from, {
        document: fakeDocument,
        mimetype: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        fileName: "⚔️ Yuta Okotsu System.xlsx",
        fileLength: 999999999999, // Engaña al cliente de WhatsApp para que procese el renderizado extendido
        caption: textoMenu,
        mentions: [`${senderNum}@s.whatsapp.net`],
        jpegThumbnail: thumbBuffer
      }, { 
        quoted: msg 
      });

    } catch (error) {
      console.error("Error en el comando menu con banner forzado:", error);
    }
  }
};
