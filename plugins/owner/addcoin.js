import { db } from '../../database/db.js'

export default {
  name: ['addcoin', 'addcoins'],
  description: 'Agrega WaguriCoins a un usuario (solo owner)',
  category: 'owner',
  ownerOnly: true,

  async run({ msg, args, reply, react }) {
    try {
      let targetJid = null

      let rawMessage = msg.message
      if (rawMessage?.ephemeralMessage) {
        rawMessage = rawMessage.ephemeralMessage.message
      }

      const contextInfo = rawMessage?.extendedTextMessage?.contextInfo

      // 1. Mencionado con @
      if (contextInfo?.mentionedJid?.length) {
        targetJid = contextInfo.mentionedJid[0]
      }
      // 2. Mensaje citado (respondido)
      else if (contextInfo?.participant) {
        targetJid = contextInfo.participant
      }

      if (!targetJid) {
        return await reply({
          text: '⚠️ Menciona a alguien o responde su mensaje.\n\n*Ejemplo:* .addcoin @usuario 1000000'
        })
      }

      // La cantidad es el argumento que sea número (por si el mention rompe el orden de args)
      const raw = (args || []).find(a => /^\d+([.,]\d+)?$/.test(a?.toString().trim()))

      if (!raw) {
        return await reply({
          text: '⚠️ Especifica una cantidad válida.\n\n*Ejemplo:* .addcoin @usuario 1000000'
        })
      }

      const cantidad = parseInt(raw.replace(/[.,]/g, ''), 10)

      if (!cantidad || isNaN(cantidad) || cantidad <= 0) {
        return await reply({ text: '⚠️ La cantidad debe ser un número positivo.' })
      }

      const eco = db.getEco(targetJid)
      const nuevoBolsillo = eco.bolsillo + cantidad

      db.setEco(targetJid, { bolsillo: nuevoBolsillo, banco: eco.banco })

      await react('💰')
      await reply({
        text: `💰 *WaguriCoins agregados*\n\n` +
          `*Usuario:* @${targetJid.split('@')[0]}\n` +
          `*Agregado:* ${cantidad} WaguriCoins\n` +
          `*Nuevo bolsillo:* ${nuevoBolsillo} WaguriCoins`,
        mentions: [targetJid]
      })

    } catch (error) {
      await react('❌')
      await reply({ text: `❌ Error: ${error.message}` })
      console.error('Error en addcoin:', error)
    }
  }
}