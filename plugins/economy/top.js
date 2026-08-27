import { db } from '../../database/db.js'

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
            jid: user.jid,
            bolsillo: bolsillo,
            banco: banco,
            total: bolsillo + banco
          }
        })
        .filter(user => user.total > 0)
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

        // Para que WhatsApp lo convierta en mención interactiva, usamos @número
        texto += `${posicion} @${numero}\n`
        texto += `   💰 *${user.total}* WaguriCoins`
        texto += `  (👜${user.bolsillo} | 🏦${user.banco})\n\n`
      }

      // El array de mentions le indica a WhatsApp a qué JIDs debe marcar como menciones reales
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
