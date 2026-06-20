import { db } from "../../database/db.js";

export default {
  name: ['listwarn', 'warns', 'advertidos'],
  description: 'Muestra la lista de miembros advertidos en el grupo',
  category: 'grupos',
  groupOnly: true,

  async run({ from, reply }) {
    try {
      const groupData = db.getGroup(from) || {}
      const groupWarns = groupData.warns || {}
      
      const filtrados = Object.entries(groupWarns).filter(([, lista]) => lista && lista.length > 0)

      if (filtrados.length === 0) {
        return await reply({ text: "🎉 ¡Excelente! No hay ningún usuario advertido en este grupo." })
      }

      let txt = `📋 *LISTA DE ADVERTIDOS EN ESTE GRUPO* 📋\n\n`
      const mentions = []

      filtrados.forEach(([jid, lista], index) => {
        mentions.push(jid)
        txt += `${index + 1}. 👤 *Usuario:* @${jid.split('@')[0]}\n`
        txt += `   📊 *Total Warns:* ${lista.length}/3\n`
        txt += `   📝 *Historial:* \n`
        lista.forEach((w) => {
          txt += `      • [${w.fecha}] ${w.razon} (por: @${w.by})\n`
          if (!mentions.includes(`${w.by}@s.whatsapp.net`)) mentions.push(`${w.by}@s.whatsapp.net`)
        })
        txt += `\n─────────────────\n\n`
      })

      await reply({ text: txt.trim(), mentions })
    } catch (err) {
      console.error("Error en comando listwarn:", err)
      await reply({ text: "❌ Ocurrió un error interno al ejecutar el comando." })
    }
  }
}
