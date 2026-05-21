export default {
  name: ["menu", "help", "ayuda"],
  description: "Muestra el menú de comandos",
  ownerOnly: false,

  async run({ sock, from, senderNum, isGroup, groupName, usedPrefix, react }) {
    try {
      // 1. Reaccionar de forma segura
      await react("🔮");

      const hora = new Date().toLocaleTimeString("es-CO", { hour12: false });
      const fecha = new Date().toLocaleDateString("es-CO");
      const lugar = isGroup ? groupName : "Chat Privado";

      // ─── DISEÑO CASILLAS ESTABLE ───────────────────────
      let textoMenu = `┌───────────────────\n`;
      textoMenu += `│ 🔥 *YUTA OKOTSU BOT* 🔥\n`;
      textoMenu += `└───────────────────\n\n`;
      
      textoMenu += `┌─── 🪐 *INFO GENERAL* 🪐\n`;
      textoMenu += `│ 👤 *Usuario:* @${senderNum}\n`;
      textoMenu += `│ 📍 *Lugar:* ${lugar}\n`;
      textoMenu += `│ ⏰ *Hora:* ${hora}\n`;
      textoMenu += `│ 📅 *Fecha:* ${fecha}\n`;
      textoMenu += `└───────────────────\n\n`;

      textoMenu += `*LISTA DE COMANDOS* 📝\n`;
      textoMenu += `_Usa el prefijo (${usedPrefix}) antes de cada comando._\n\n`;

      // 🪐 CATEGORÍA INFO
      textoMenu += `╭───────────────\n`;
      textoMenu += `│ 🪐 *INFO*\n`;
      textoMenu += `├───────────────\n`;
      textoMenu += `│ ➔ ${usedPrefix}menu\n`;
      textoMenu += `│ ➔ ${usedPrefix}ping\n`;
      textoMenu += `╰───────────────\n\n`;

      // 👥 CATEGORÍA GRUPOS
      textoMenu += `╭───────────────\n`;
      textoMenu += `│ 👥 *GRUPOS*\n`;
      textoMenu += `├───────────────\n`;
      textoMenu += `│ ➔ ${usedPrefix}tag\n`;
      textoMenu += `╰───────────────\n\n`;

      textoMenu += `⏳ _Powered by DuarteXV_`;

      // 2. Enviar usando la estructura exacta de tu comando 'tag'
      await sock.sendMessage(from, {
        text: textoMenu,
        mentions: [`${senderNum}@s.whatsapp.net`],
      });
      
    } catch (error) {
      console.error("Error en el comando menu estático:", error);
      throw error; 
    }
  }
};
