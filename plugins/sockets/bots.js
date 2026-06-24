import { db } from '../../database/db.js'
import config from '../../config.js'
import fs from 'fs'

export default {
  name: ['bots', 'listbots'],
  description: 'Muestra los bots conectados',
  category: 'sockets',

  // Añadimos 'm' y un objeto vacío por defecto para evitar errores de desestructuración
  async run({ sock, react, reply, m } = {}) {
    try {
      await react('🤖')

      const limpiarNumero = (jid = '') =>
        jid.split('@')[0].split(':')[0].replace(/\D/g, '')

      const obtenerNombre = (numero) => {
        try {
          const bot = db.getBot(`${numero}@s.whatsapp.net`)

          if (
            bot?.label &&
            bot.label !== 'Subbot' &&
            bot.label !== 'MAIN' &&
            !bot.label.startsWith('SUB_')
          ) {
            return bot.label
          }

          return config.botName
        } catch {
          return config.botName
        }
      }

      const todosLosBots = db.getAllBots ? db.getAllBots() : []
      const registroMain = todosLosBots.find(b => (b.isMain === true || b.isMain === 1) && b.jid)

      const numeroPrincipal = registroMain
        ? limpiarNumero(registroMain.jid)
        : (global.mainBotNum || limpiarNumero(sock?.user?.id))

      const nombrePrincipal = obtenerNombre(numeroPrincipal)

      const subbotsDir = './sessions/subbots'
      let subbots = []

      if (fs.existsSync(subbotsDir)) {
        subbots = fs
          .readdirSync(subbotsDir, { withFileTypes: true })
          .filter(dir => dir.isDirectory())
          .map(dir => dir.name)
          .filter(name => name.startsWith('sub_'))
          .map(name => name.replace('sub_', ''))
          .filter(numero => numero !== numeroPrincipal)
      }

      // Obtener de forma segura el JID de quien envió el mensaje
      const senderJid = m?.sender || m?.from || sock?.user?.id || ''
      const senderNumber = limpiarNumero(senderJid)

      // Estructura principal del diseño solicitado
      let text = `•.°· ◇ \`ᒪIՏTᗩ ᗪᗴ ᗷOTՏ ᗩᑕTIᐯOՏ\` ◇ ·°.•\n`
      text += `〔💎〕Principal: ${nombrePrincipal}\n`
      text += `〔🌀〕Sub-bots: ${subbots.length}\n`
      text += `〔🌱〕En este grupo: \n\n`
      
      // Mostrar la mención solo si se encontró un número válido
      if (senderNumber) {
        text += `@${senderNumber}\n`
      }

      // Datos del Bot Principal
      text += `> *𖠌 ʙᴏᴛ::* ${nombrePrincipal}\n`
      text += `> *⚝ ᴛɪᴘᴏ::* Principal 👑\n\n`

      // Datos de los Sub-bots si existen
      if (subbots.length > 0) {
        for (const numero of subbots) {
          const nombreSub = obtenerNombre(numero)
          text += `> *𖠌 ʙᴏᴛ::* ${nombreSub}\n`
          text += `> *⚝ ᴛɪᴘᴏ::* Sub-bot 🌀\n\n`
        }
      }

      text += `🪼 _Powered by DuarteXV_`

      // Configuramos las menciones de forma segura
      const opcionesEnvio = { text }
      if (senderJid) {
        opcionesEnvio.mentions = [senderJid]
      }

      await reply(opcionesEnvio)
      await react('✅')

    } catch (e) {
      console.error(e)
      if (react) await react('❌')
      if (reply) {
        await reply({
          text: `❌ Error:\n${e.message}`
        })
      }
    }
  }
}
