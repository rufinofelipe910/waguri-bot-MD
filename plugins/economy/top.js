import { db } from '../../database/db.js'

function cleanJid(jid = "") {
  if (!jid) return "";
  const atIndex = jid.lastIndexOf("@");
  if (atIndex === -1) return jid.split(":")[0];
  const userPart = jid.slice(0, atIndex).split(":")[0];
  const domainPart = jid.slice(atIndex + 1);
  return `${userPart}@${domainPart}`;
}

export default {
  name: ['top', 'ranking', 'leaderboard', 'lb'],
  description: 'Muestra el ranking de usuarios con más WaguriCoins en el grupo',
  category: 'economy',
  ownerOnly: false,

  async run({ sock, from, reply, react }) {
    try {
      const allUsers = db.getAllUsers()

      if (!allUsers || allUsers.length === 0) {
        return await reply({
          text: '📊 *Ranking de WaguriCoins*\n\nNo hay datos de usuarios aún.'
        })
      }

      const ranking = allUsers
        .map(user => {
          const bolsillo = user.bolsillo ?? 0
          const banco = user.banco ?? 0
          return {
            jid: cleanJid(user.jid),
            bolsillo: bolsillo,
            banco: banco,
            total: bolsillo + banco
          }
        })
        .filter(user => user.total > 0 && user.jid.includes('@'))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)

      if (ranking.length === 0) {
        return await reply({
          text: '📊 *Ranking de WaguriCoins*\n\nNadie tiene monedas todavía. ¡Sé el primero en usar *.work*!'
        })
      }

      const medallas = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']

      let texto = '🏆 *TOP 10 - WaguriCoins* 🏆\n'
      texto += '╰━━━━━━(☆)━━━━━━─╮\n\n'

      for (let i = 0; i < ranking.length; i++) {
        const user = ranking[i]
        const posicion = medallas[i] || `${i + 1}.`
        const numero = user.jid.split('@')[0]

        // Usamos formato @numero para que WhatsApp lo convierta en etiqueta interactiva
        texto += `${posicion} @${numero}\n`
        texto += `   💰 *${user.total}* WaguriCoins`
        texto += `  (👜${user.bolsillo} | 🏦${user.banco})\n\n`
      }

      // Pasamos los JIDs limpios correspondientes en el array de menciones
      const mentions = ranking.map(u => u.jid)

      if (react) await react('🏆')
      await reply({ text: texto, mentions })

    } catch (error) {
      console.error('Error en top:', error)
      if (react) await react('❌')
      await reply({
        text: `❌ Error al obtener el ranking: ${error.message}`
      })
    }
  }
}
