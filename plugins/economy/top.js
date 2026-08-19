import { db } from '../../database/db.js'

export default {
  name: ['top', 'ranking', 'richest'],
  description: 'Muestra el top de usuarios más ricos',
  category: 'economy',
  ownerOnly: false,

  async run({ reply, react }) {
    try {
      await react('🏆')

      const todos = db.getAllEco ? db.getAllEco() : null

      if (!todos || !Array.isArray(todos) || !todos.length) {
        await react('❌')
        return reply({ text: '❌ todavía no hay datos suficientes para armar un ranking' })
      }

      const ordenado = todos
        .map(u => ({ jid: u.jid || u.id, total: (u.bolsillo || 0) + (u.banco || 0) }))
        .filter(u => u.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)

      if (!ordenado.length) {
        return reply({ text: '❌ nadie tiene WaguriCoins todavía' })
      }

      const medallas = ['🥇', '🥈', '🥉']

      let texto = `🏆 *TOP 10 MÁS RICOS*\n\n`

      ordenado.forEach((u, i) => {
        const posicion = medallas[i] || `${i + 1}.`
        const numero = u.jid.split('@')[0]
        texto += `${posicion} @${numero} — *${u.total.toLocaleString()}* WaguriCoins\n`
      })

      await reply({
        text: texto,
        mentions: ordenado.map(u => u.jid)
      })

      await react('✅')

    } catch (error) {
      await react('❌')
      await reply({ text: `❌ Error: ${error.message}` })
      console.error('Error en top:', error)
    }
  }
}