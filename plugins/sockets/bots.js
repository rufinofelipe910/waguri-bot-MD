import { db } from '../../database/db.js'
import config from '../../config.js'
import fs from 'fs'
import path from 'path'

export default {
name: ['bots', 'listbots'],
description: 'Muestra los bots conectados',
category: 'sockets',

async run({ sock, react, reply }) {
try {
await react('🤖')

  const limpiarNumero = (jid = '') =>
    jid.split('@')[0].split(':')[0].replace(/\D/g, '')

  const obtenerNombre = (numero) => {
    try {
      const bot = db.getBot(numero)

      if (
        bot?.label &&
        bot.label !== 'Subbot' &&
        !bot.label.startsWith('SUB_')
      ) {
        return bot.label
      }

      return config.botName
    } catch {
      return config.botName
    }
  }

  const numeroPrincipal = limpiarNumero(sock.user?.id)

  const subbotsDir = './sessions/subbots'

  let subbots = []

  if (fs.existsSync(subbotsDir)) {
    const carpetas = fs.readdirSync(subbotsDir, {
      withFileTypes: true
    })

    subbots = carpetas
      .filter(dir => dir.isDirectory())
      .map(dir => dir.name)
      .filter(name => name.startsWith('sub_'))
      .map(name => name.replace('sub_', ''))
  }

  let text = `✨ ═══ 🫧 *${config.botName.toUpperCase()}* 🫧 ═══ ✨\n`
  text += `🤖 _Bots actualmente conectados_\n\n`

  text += `👑 *BOT PRINCIPAL*\n`
  text += `   ✦ Nombre: ${config.botName}\n`
  text += `   ✦ Número: +${numeroPrincipal}\n\n`

  text += `━━━━━━━━━━━━━━\n\n`

  text += `🤖 *SUBBOTS (${subbots.length})*\n\n`

  if (!subbots.length) {
    text += `⚠️ No hay subbots conectados.\n\n`
  } else {
    let i = 1

    for (const numero of subbots) {
      const nombre = obtenerNombre(numero)

      text += `🟢 *${i}. ${nombre}*\n`
      text += `   ✦ Número: +${numero}\n\n`

      i++
    }
  }

  text += `🪼 _Powered by DuarteXV_`

  await reply({ text })
  await react('✅')

} catch (e) {
  console.error(e)

  await react('❌')
  await reply({
    text: `❌ Error:\n${e.message}`
  })
}

}
}