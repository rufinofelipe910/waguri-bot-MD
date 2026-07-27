import { Akinator, AkinatorAnswer } from '@aqul/akinator-api'
import { db } from '../../database/db.js'

global.akiSessions = global.akiSessions || {}

const RESPUESTAS = {
  '1': AkinatorAnswer.Yes, 'si': AkinatorAnswer.Yes, 'sí': AkinatorAnswer.Yes,
  '2': AkinatorAnswer.No, 'no': AkinatorAnswer.No,
  '3': AkinatorAnswer.DontKnow, 'nose': AkinatorAnswer.DontKnow, 'no se': AkinatorAnswer.DontKnow, 'no lo se': AkinatorAnswer.DontKnow, 'no lo sé': AkinatorAnswer.DontKnow,
  '4': AkinatorAnswer.Probably, 'probablemente': AkinatorAnswer.Probably,
  '5': AkinatorAnswer.ProbablyNot, 'probablemente no': AkinatorAnswer.ProbablyNot
}

function formatearPregunta(session) {
  const progreso = Math.round(session.api.progress || 0)
  return (
    `✿ Akinator · Pregunta ${session.numPregunta} (${progreso}%)\n` +
    `> *${session.api.question}*\n\n` +
    `1. Sí\n2. No\n3. No lo sé\n4. Probablemente\n5. Probablemente no\n\n` +
    `> escribe *atras* para retroceder o *salir* para rendirte`
  )
}

export default {
  name: ['aki', 'akinator'],
  description: 'Juega Akinator, adivina en qué personaje piensas',
  category: 'games',
  ownerOnly: false,

  async run({ from, reply, react }) {
    try {
      if (global.akiSessions[from]) {
        return reply({ text: '⚠️ ya hay una partida activa en este chat, escribe *salir* para terminarla primero' })
      }

      await react('🎮')

      const api = new Akinator({ region: 'es', childMode: false })
      await api.start()

      const session = { api, numPregunta: 1 }
      global.akiSessions[from] = session

      await reply({
        text:
          `✿ ¡Akinator · Personajes!\n` +
          `> *piensa en un personaje y responde mis preguntas*\n\n` +
          formatearPregunta(session)
      })

    } catch (error) {
      delete global.akiSessions[from]
      await react('❌')
      await reply({ text: `❌ Error: ${error.message}` })
      console.error('Error en akinator:', error)
    }
  }
}

export async function handleAkinatorAnswer({ sock, msg, from, sender, body }) {
  const session = global.akiSessions[from]
  if (!session) return false

  const texto = (body || '').trim().toLowerCase()
  if (!texto) return false

  try {
    if (session.estado === 'confirmando') {
      if (texto === 'si' || texto === 'sí') {
        const premio = Math.floor(Math.random() * 9000000) + 1000000
        const eco = db.getEco(sender)
        db.setEco(sender, { bolsillo: eco.bolsillo + premio, banco: eco.banco })

        await sock.sendMessage(from, {
          text:
            `❀ ¡Lo adiviné! era *${session.api.sugestion_name}*\n` +
            `> partida completada en ${session.numPregunta} preguntas\n\n` +
            `⛁ Has ganado *${premio.toLocaleString()}* waguricoins`
        }, { quoted: msg })

        delete global.akiSessions[from]
        return true
      }

      if (texto === 'no') {
        session.estado = null
        session.numPregunta++
        await sock.sendMessage(from, {
          text: `😅 vaya, sigamos entonces\n\n` + formatearPregunta(session)
        }, { quoted: msg })
        return true
      }

      return false
    }

    if (texto === 'salir') {
      delete global.akiSessions[from]
      await sock.sendMessage(from, { text: '🚪 partida de Akinator cancelada' }, { quoted: msg })
      return true
    }

    if (texto === 'atras' || texto === 'atrás') {
      await session.api.cancelAnswer()
      session.numPregunta = Math.max(1, session.numPregunta - 1)
      await sock.sendMessage(from, { text: formatearPregunta(session) }, { quoted: msg })
      return true
    }

    if (!(texto in RESPUESTAS)) return false

    await session.api.answer(RESPUESTAS[texto])

    if (session.api.isWin) {
      session.estado = 'confirmando'
      await sock.sendMessage(from, {
        image: { url: session.api.sugestion_photo },
        caption:
          `✿ ¡Pienso en...!\n` +
          `> *${session.api.sugestion_name}*\n` +
          `> ${session.api.sugestion_desc || ''}\n\n` +
          `¿Acerté? responde *si* o *no*`
      }, { quoted: msg })
      return true
    }

    session.numPregunta++
    await sock.sendMessage(from, { text: formatearPregunta(session) }, { quoted: msg })
    return true

  } catch (error) {
    console.error('Error en sesión de akinator:', error)
    delete global.akiSessions[from]
    await sock.sendMessage(from, { text: `❌ Error en la partida de Akinator: ${error.message}` }, { quoted: msg })
    return true
  }
}