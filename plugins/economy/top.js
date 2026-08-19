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
        .map(user => ({
          jid: user.jid,
          bolsillo: user.bolsillo ?? 0,
          banco: user.banco ?? 0,
          total: (user.bolsillo ?? 0) + (user.banco ?? 0)
        }))
        .filter(user => user.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)

      if (ranking.length === 0) {
        return await reply({
          text: '📊 *Ranking de WaguriCoins*\n\nNadie tiene monedas todavía. ¡Sé el primero en usar *.work*!'
        })
      }

      let groupMetadata = null
      try {
        groupMetadata = await sock.groupMetadata(from)
      } catch {
        // No es grupo o falló
      }

      const participantsMap = new Map()
      if (groupMetadata?.participants) {
        for (const p of groupMetadata.participants) {
          participantsMap.set(p.id, p)
        }
      }

      const medallas = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']

      let texto = '🏆 *TOP 10 - WaguriCoins* 🏆\n'
      texto += '╰━━━━━━(☆)━━━━━━─╮\n\n'

      for (let i = 0; i < ranking.length; i++) {
        const user = ranking[i]
        const posicion = medallas[i] || `${i + 1}.`
        const numero = user.jid.split('@')[0]

        let nombre = `@${numero}`
        const participant = participantsMap.get(user.jid)
        if (participant?.notify) {
          nombre = participant.notify
        } else if (participant?.name) {
          nombre = participant.name
        }

        texto += `${posicion} *${nombre}*\n`
        texto += `   💰 *${user.total}* WaguriCoins`
        texto += `  (👜${user.bolsillo} | 🏦${user.banco})\n\n`
      }

      const mentions = ranking.map(u => u.jid)

      await react('🏆')
      await reply({ text: texto, mentions })

    } catch (error) {
      console.error('Error en top:', error)
      await react('❌')
      await reply({
        text: `❌ Error al obtener el ranking: ${error.message}`
      })
    }
  }
}
