import { getPlugins } from "../core/pluginLoader.js";

export default {
  name: ["menu", "help", "ayuda"],
  description: "Muestra el menú de comandos",
  ownerOnly: false,

  async run({ reply, react, senderNum, isGroup, groupName, usedPrefix }) {
    try {
      // 1. Reaccionar de inmediato
      await react("🔮");

      const pluginsMap = getPlugins();
      const categories = {};
      
      // En lugar de usar un Set que congela la consola, filtramos de forma manual y segura
      for (const [key, plugin] of pluginsMap.entries()) {
        if (!plugin || !plugin.name) continue;

        // Para evitar duplicar el comando en el menú por culpa de sus alias (como menu, help, ayuda),
        // solo procesamos el comando si la 'key' del Map coincide con el primer alias oficial.
        const names = Array.isArray(plugin.name) ? plugin.name : [plugin.name];
        const firstName = names[0].toLowerCase();
        
        if (key !== firstName) continue; // Si es un alias secundario, lo saltamos

        const cat = plugin.category || "misc";
        if (!categories[cat]) categories[cat] = [];
        
        categories[cat].push(firstName);
      }

      // Iconos para tus categorías
      const catIcons = {
        grupos:  "✨",
        info:    "🪐",
        owner:   "👑",
        premium: "🔮",
        misc:    "🃏",
        media:   "🎬",
        util:    "🛠️",
      };

      const hora = new Date().toLocaleTimeString("es-CO", { hour12: false });
      const fecha = new Date().toLocaleDateString("es-CO");
      const lugar = isGroup ? groupName : "Chat Privado";

      // ─── DISEÑO DE CASILLAS ESTABLE ─────────────────────
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

      for (const [cat, cmds] of Object.entries(categories)) {
        const icon = catIcons[cat] || "🃏";
        text += `╭───────────────\n`;
        text += `│ ${icon} *${cat.toUpperCase()}*\n`;
        text += `├───────────────\n`;
        for (const cmd of cmds) {
          text += `│ ➔ ${usedPrefix}${cmd}\n`;
        }
        text += `╰───────────────\n\n`;
      }

      text += `⏳ _Powered by DuarteXV_`;

      // Enviar el mensaje estructurado con mención activa
      await reply({ 
        text, 
        mentions: [`${senderNum}@s.whatsapp.net`] 
      });
      
    } catch (error) {
      console.error("Error en el comando menu:", error);
      throw error; 
    }
  }
};
