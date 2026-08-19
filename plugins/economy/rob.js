import { db } from '../../database/db.js'

const COOLDOWN = 5 * 60 * 1000 // 5 minutos
const PROBABILIDAD_EXITO = 0.4 // 40% de éxito
const MIN_ROBABLE = 100 // el objetivo necesita al menos esto en el bolsillo
const PORCENTAJE_ROBO = [0.1, 0.3] // roba entre 10% y 30% del bolsillo del objetivo
const MULTA_FALLO = [50, 200] // si falla, paga esta multa fija

function normalizeJid(jid) {
  if (!jid) return jid
  return jid.replace(/:\d+(?=@)/, '')
}

function randomEntre(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export default {
  name: ['rob', 'robar'],
  description: 'Intenta robarle WaguriCoins a otro usuario',
  category: 'economy',
  ownerOnly: false,

  async run({ sock, msg, from, sender, reply, react }) {
    try {
      let rawMessage = msg.message
      if (rawMessage?.ephemeralMessage) {
        rawMessage = rawMessage.ephemeralMessage.message
      }

      const contextInfo = rawMessage?.extendedTextMessage?.contextInfo

      let targetJid = null
      if (contextInfo?.mentionedJid?.length) {
        targetJid = contextInfo.mentionedJid[0]
      } else if (contextInfo?.participant) {
        targetJid = contextInfo.participant
      }

      if (!targetJid) {
        return reply({ text: '🔪 menciona o responde al usuario que quieres robar\n\n*Ejemplo:* .rob @usuario' })
      }

      targetJid = normalizeJid(targetJid)
      const senderClean = normalizeJid(sender)

      if (targetJid === senderClean) {
        return reply({ text: '❌ no puedes robarte a ti mismo' })
      }

      const ecoLadron = db.getEco(senderClean)
      const ahora = Date.now()
      const tiempoRestante = COOLDOWN - (ahora - (ecoLadron.lastRob || 0))

      if (tiempoRestante > 0) {
        const mins = Math.floor(tiempoRestante / 60000)
        const segs = Math.floor((tiempoRestante % 60000) / 1000)
        return reply({ text: `⏳ Estás escondido de la policía.\n\n> Puedes volver a robar en *${mins}m ${segs}s*` })
      }

      const ecoObjetivo = db.getEco(targetJid)

      if (ecoObjetivo.bolsillo < MIN_ROBABLE) {
        return reply({ text: `❌ esa persona no tiene suficiente dinero en el bolsillo para valer la pena robarle (mínimo ${MIN_ROBABLE} WaguriCoins)` })
      }

      await react('🔪')

      const exito = Math.random() < PROBABILIDAD_EXITO

      if (exito) {
        const porcentaje = Math.random() * (PORCENTAJE_ROBO[1] - PORCENTAJE_ROBO[0]) + PORCENTAJE_ROBO[0]
        const cantidad = Math.floor(ecoObjetivo.bolsillo * porcentaje)

        db.setEco(targetJid, { bolsillo: ecoObjetivo.bolsillo - cantidad })
        db.setEco(senderClean, { bolsillo: ecoLadron.bolsillo + cantidad, lastRob: ahora })

        await reply({
          text: `🔪 *¡Robo exitoso!*\n\n` +
            `Le robaste *${cantidad}* WaguriCoins a @${targetJid.split('@')[0]}\n` +
            `👜 tu bolsillo ahora: ${ecoLadron.bolsillo + cantidad} WaguriCoins`,
          mentions: [targetJid]
        })
      } else {
        const multa = randomEntre(MULTA_FALLO[0], MULTA_FALLO[1])
        const multaReal = Math.min(multa, ecoLadron.bolsillo)

        db.setEco(senderClean, { bolsillo: ecoLadron.bolsillo - multaReal, lastRob: ahora })

        await reply({
          text: `🚨 *¡Te atraparon!*\n\n` +
            `Fallaste el robo y pagaste una multa de *${multaReal}* WaguriCoins\n` +
            `👜 tu bolsillo ahora: ${ecoLadron.bolsillo - multaReal} WaguriCoins`
        })
      }

      await react('✅')

    } catch (error) {
      await react('❌')
      await reply({ text: `❌ Error: ${error.message}` })
      console.error('Error en rob:', error)
    }
  }
}