import { db } from '../../database/db.js'
import config from '../../config.js'

export default {
  name: ['bots', 'listbots'],
  description: 'Muestra los bots conectados',
  category: 'sockets',

  async run({ sock, react, reply, mainBotNum }) {
    await react('🤖')

    try {
      const limpiarNumero = (jid = '') =>
        jid.split('@')[0].split(':')[0].replace(/\D/g, '')

      const obtenerNombre = (bot) => {
        if (
          bot?.label &&
          bot.label !== 'Subbot' &&
          !bot.label.startsWith('SUB_')
        ) {
          return bot.label
        }

        return config.botName
      }

      const botsOnline = db.getOnlineBots()

      const numeroPrincipal =
        mainBotNum ||
        limpiarNumero(sock.user?.id)

      let principal =
        botsOnline.find(
          bot =>
            bot.isMain === true ||
            limpiarNumero(bot.jid) === numeroPrincipal
        )

      if (!principal) {
        principal = {
          jid: numeroPrincipal,
          label: config.botName,
          isMain: true
        }
      }

      const subbots = botsOnline.filter(
        bot => limpiarNumero(bot.jid) !== limpiarNumero(principal.jid)
      )

      let text = `✨ ═══ 🫧 *${config.botName.toUpperCase()}* 🫧 ═══ ✨\n`
      text += `🤖 _Bots conectados actualmente_\n\n`

      text += `👑 *BOT PRINCIPAL*\n`
      text += `   ✦ Nombre: ${obtenerNombre(principal)}\n`
      text += `   ✦ Número: +${limpiarNumero(principal.jid)}\n\n`

      text += `━━━━━━━━━━━━━━\n\n`

      text += `🤖 *SUBBOTS (${subbots.length})*\n\n`

      if (!subbots.length) {
        text += `⚠️ No hay subbots conectados.\n\n`
      } else {
        let i = 1

        for (const bot of subbots) {
          text += `🟢 *${i}. ${obtenerNombre(bot)}*\n`
          text += `   ✦ Número: +${limpiarNumero(bot.jid)}\n\n`
          i++
        }
      }

      text += `🪼 _Powered by DuarteXV_`

      await reply({ text })
      await react('✅')

    } catch (e) {
      await react('❌')
      await reply({
        text: `❌ Error:\n${e.message}`
      })
    }
  }
}