import { activeBots } from '../../core/subbotManager.js'

export default {
  name: ['bots', 'listbots'],
  description: 'Muestra todos los bots conectados',
  category: 'misc',
  ownerOnly: false,

  async run({ react, reply }) {
    await react('🤖')

    const hora  = new Date().toLocaleTimeString('es-CO', { hour12: false })
    const fecha = new Date().toLocaleDateString('es-CO')

    const botsActivos = [...activeBots.entries()].filter(([, bot]) =>
      bot.status === 'online'
    )

    let text = `✨ ═══ 🫧 *YUTA OKOTSU* 🫧 ═══ ✨\n`
    text += `🤖 _Bots conectados al sistema_\n\n`

    if (botsActivos.length === 0) {
      text += `❌ No hay bots conectados.\n`
    } else {
      let i = 1
      for (const [, bot] of botsActivos) {
        const tipo = bot.isMain ? '👑 *PRINCIPAL*' : '🤖 Subbot'
        const num  = bot.jid?.split(':')[0] || bot.jid?.split('@')[0] || 'N/A'
        text += `🟢 *${i}. ${bot.label}*\n`
        text += `   ✦ Tipo: ${tipo}\n`
        text += `   ✦ Número: ${num}\n\n`
        i++
      }
    }

    text += `_${hora} • ${fecha}_\n`
    text += `⚔️ _Yuta Okotsu MD | DuarteXV_`

    await reply({ text })
  }
}