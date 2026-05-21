export default {
  name: ["menu", "help", "ayuda"],
  description: "Muestra el menú de comandos",
  ownerOnly: false,

  async run({ reply, react, senderNum, isGroup, groupName, usedPrefix }) {
    try {
      // 1. Reaccionar
      await react("🔮");

      const hora = new Date().toLocaleTimeString("es-CO", { hour12: false });
      const fecha = new Date().toLocaleDateString("es-CO");
      const lugar = isGroup ? groupName : "Chat Privado";

      // ─── DISEÑO CASILLAS (ESCRITO A MANO) ─────────────────
      let text = `┌───────────────────\n`;
      text += `│ 🔥 *YUTA OKOTSU BOT* 🔥\n`;
      text += `└───────────────────\n\n`;
      
      text += `┌─── 🪐 *INFO GENERAL* 🪐\n`;
      text += `│ 👤 *Usuario:* @${senderNum}\n`;
      text += `│ 📍 *Lugar:* ${lugar}\n`;
      text += `│ ⏰ *Hora:* ${hora}\n`;
      text += `│ 📅 *Fecha:* ${fecha}\n`;
      text += `└───────────────────\n\n`;

      text += `*LISTA DE COMANDOS* 📝\n`;
      text += `_Usa el prefijo (${usedPrefix}) antes de cada comando._\n\n`;

      // 👥 CATEGORÍA INFORMACIÓN
      text += `╭───────────────\n`;
      text += `│ 🪐 *INFO*\n`;
      text += `├───────────────\n`;
      text += `│ ➔ ${usedPrefix}menu\n`;
      text += `│ ➔ ${usedPrefix}ping\n`;
      text += `╰───────────────\n\n`;

      // 👑 CATEGORÍA OWNER (Añade o quita según tus comandos reales)
      text += `╭───────────────\n`;
      text += `│ 👑 *OWNER*\n`;
      text += `├───────────────\n`;
      text += `│ ➔ ${usedPrefix}test\n`;
      text += `╰───────────────\n\n`;

      text += `⏳ _Powered by DuarteXV_`;

      // 2. Enviar el mensaje
      await reply({ 
        text, 
        mentions: [`${senderNum}@s.whatsapp.net`] 
      });
      
    } catch (error) {
      console.error("Error en el comando menu estático:", error);
      throw error; 
    }
  }
};
