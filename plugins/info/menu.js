import axios from "axios";

// Función para descargar la imagen usando axios como buffer
async function getBuffer(url) {
  try {
    const res = await axios({
      method: "get",
      url: url,
      responseType: "arraybuffer"
    });
    return Buffer.from(res.data);
  } catch (e) {
    throw new Error(`Error descargando la imagen con axios: ${e.message}`);
  }
}

export default {
  name: ["menu", "help", "ayuda"],
  description: "Muestra el menú estético en formato documento banner usando el flujo oficial",
  ownerOnly: false,

  async run({ sock, from, senderNum, isGroup, groupName, usedPrefix, react, msg }) {
    try {
      await react("⛩️");

      const hora = new Date().toLocaleTimeString("es-CO", { hour12: false });
      const fecha = new Date().toLocaleDateString("es-CO");
      const lugar = isGroup ? groupName : "Chat Privado";

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

      // Descargamos el buffer usando axios
      const thumbBuffer = await getBuffer(urlFoto);
      
      // Creamos el buffer del documento falso con el texto del menú
      const fakeDocument = Buffer.from(textoMenu, "utf-8");

      // Enviamos utilizando el método oficial del bot para que sea procesado por el ejecutador
      await sock.sendMessage(from, {
        document: fakeDocument,
        mimetype: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        fileName: "⚔️ Yuta Okotsu System.xlsx",
        caption: textoMenu,
        mentions: [`${senderNum}@s.whatsapp.net`],
        jpegThumbnail: thumbBuffer,
        thumbnailWidth: 400,
        thumbnailHeight: 180
      }, { 
        quoted: msg // Lo vincula al mensaje que envió el usuario
      });

    } catch (error) {
      console.error("Error en el comando menu por flujo oficial:", error);
    }
  }
};
