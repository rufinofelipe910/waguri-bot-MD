import { getPlugins } from "../core/pluginLoader.js";

export default {
  name: ["menu", "help", "ayuda"],
  description: "Muestra el menú de comandos",
  ownerOnly: false,

  async run({ reply, react, senderNum, isGroup, groupName, usedPrefix }) {
    try {
      await react("🔮");

      const pluginsMap = getPlugins();
      const categories = {};
      const uniquePlugins = new Set(pluginsMap.values());

      for (const plugin of uniquePlugins) {
        if (!plugin || !plugin.name) continue;
        const cat = plugin.category || "misc";
        if (!categories[cat]) categories[cat] = [];
        
        const names = Array.isArray(plugin.name) ? plugin.name : [plugin.name];
        categories[cat].push(names[0]);
      }

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
