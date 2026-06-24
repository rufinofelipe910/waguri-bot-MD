import { db } from '../../database/db.js'
import config from '../../config.js'
import fs from 'fs'

export default {
  name: ['bots', 'listbots'],
  description: 'Muestra los bots conectados',
  category: 'sockets',

  async run({ sock, from, msg, react, reply }) {
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

          return bot?.pushName || bot?.name || config.botName
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

      // Array dinámico para almacenar las menciones JID, idéntico al sistema de tagall
      const participants = []

      // Estructura principal con el diseño limpio solicitado
      let report = `•.°· ◇ \`ᒪIՏTᗩ ᗪᗴ ᗷOTՏ ᗩᑕTIᐯOՏ\` ◇ ·°.•\n`
      report += `〔💎〕Principal: ${nombrePrincipal}\n`
      report += `〔🌀〕Sub-bots: ${subbots.length}\n`
      report += `〔🌱〕En este grupo: \n\n`

      // Agregar bot principal con su formato de mención
      const jidPrincipal = `${numeroPrincipal}@s.whatsapp.net`
      participants.push(jidPrincipal)
      
      report += `> *𖠌 ʙᴏᴛ::* @${numeroPrincipal} (${nombrePrincipal})\n`
      report += `> *⚝ ᴛɪᴘᴏ::* Principal 👑\n\n`

      // Agregar sub-bots iterando el array
      if (subbots.length > 0) {
        for (const numero of subbots) {
          const nombreSub = obtenerNombre(numero)
          const jidSub = `${numero}@s.whatsapp.net`
          
          participants.push(jidSub)
          
          report += `> *𖠌 ʙᴏᴛ::* @${numero} (${nombreSub})\n`
          report += `> *⚝ ᴛɪᴘᴏ::* Sub-bot 🌀\n\n`
        }
      }

      report += `🪼 _Powered by DuarteXV_`

      // Envío nativo de Baileys idéntico al comando tagall
      await sock.sendMessage(
        from,
        {
          text: report,
          mentions: participants.filter(Boolean),
        },
        { quoted: msg }
      )

      await react('✅')

    } catch (e) {
      console.error(e)
      await react('❌')
      
      if (reply) {
        await reply({
          text: `Failed`,
        })
      }
    }
  }
}
