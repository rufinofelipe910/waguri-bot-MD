import { Aki } from 'aki-api'
import { db } from '../../database/db.js'

// Sesiones activas de Akinator, guardadas por chat (from)
global.akiSessions = global.akiSessions || {}

const RESPUESTAS = {
  '1': 0, 'si': 0, 'sí': 0,
  '2': 1, 'no': 1,
  '3': 2, 'nose': 2, 'no se': 2, 'no lo se': 2, 'no lo sé': 2,
  '4': 3, 'probablemente': 3,
  '5': 4, 'probablemente no': 4
}

function formatearPregunta(session) {
  const progreso = Math.round(session.aki.progress || 0)
  return (
    `✿ Akinator · Pregunta ${session.numPregunta} (${progreso}%)\n` +
    `> *${session.aki.question}*\n\n` +
    `1. Sí\n2. No\n3. No lo sé\n4. Probablemente\n5. Probablemente no\n\n` +
    `> escribe *atras* para retroceder o *salir* para rendirte`
  )
}

async function enviarGuess(sock, from, msg, session) {
  const guess = session.aki.answers?.[0]

  if (!guess) {
    console.log('[AKI DEBUG] win() no devolvió candidatos:', session.aki.answers)
    return false
  }

  session.estado = 'confirmando'
  session.guessActual = guess

  const caption =
    `✿ ¡Pienso en...!\n` +
    `> *${guess.name}*\n` +
    `> ${guess.description || 'Sin descripción'}\n\n` +
    `_Enviado por ${guess.pseudo || 'Akinator'}_\n\n` +
    `¿Acerté? responde *si* o *no*`

  await sock.sendMessage(
    from,
    { image: { url: guess.absolute_picture_path }, caption },
    { quoted: msg }
  )

  return true
}

export default {
  name: ['aki', 'akinator'],
  description: 'Juega Akinator, adivina en qué personaje piensas',
  category: 'games',
  ownerOnly: false,

  async run({ sock, from, msg, reply, react }) {
    try {
      if (global.akiSessions[from]) {
        return reply({ text: '⚠️ ya hay una partida activa en este chat, escribe *salir* para terminarla primero' })
      }

      await react('🎮')

      const aki = new Aki({ region: 'es', childMode: false })
      await aki.start()

      const session = { aki, numPregunta: 1, estado: 'jugando' }
      global.akiSessions[from] = session

      await reply({
        text:
          `✿ ¡Akinator · Personajes!\n` +
          `> *piensa en un personaje y responde mis preguntas*\n\n` +
          formatearPregunta(session)
      })

    } catch (error) {
      await react('❌')
      delete global.akiSessions[from]
      await reply({ text: `❌ Error: ${error.message}` })
      console.error('Error en akinator:', error)
    }
  }
}

// Maneja las respuestas libres (sin prefijo) mientras hay una partida activa
export async function handleAkinatorAnswer({ sock, msg, from, sender, body }) {
  const session = global.akiSessions[from]
  if (!session) return false

  const texto = (body || '').trim().toLowerCase()
  if (!texto) return false

  try {
    // Confirmación final (¿acerté? si/no)
    if (session.estado === 'confirmando') {
      if (texto === 'si' || texto === 'sí') {
        const premio = Math.floor(Math.random() * 9000000) + 1000000
        const eco = db.getEco(sender)
        db.setEco(sender, { bolsillo: eco.bolsillo + premio, banco: eco.banco })

        await sock.sendMessage(from, {
          text:
            `❀ ¡Lo adiviné! era *${session.guessActual.name}*\n` +
            `> partida completada en ${session.numPregunta} preguntas\n\n` +
            `⛁ Has ganado *${premio.toLocaleString()}* waguricoins`
        }, { quoted: msg })

        delete global.akiSessions[from]
        return true
      }

      if (texto === 'no') {
        // Seguimos jugando, intentamos más preguntas
        session.estado = 'jugando'
        session.numPregunta++
        await sock.sendMessage(from, {
          text: `😅 vaya, sigamos entonces\n\n` + formatearPregunta(session)
        }, { quoted: msg })
        return true
      }

      return false
    }

    // Comandos de sesión
    if (texto === 'salir') {
      delete global.akiSessions[from]
      await sock.sendMessage(from, { text: '🚪 partida de Akinator cancelada' }, { quoted: msg })
      return true
    }

    if (texto === 'atras' || texto === 'atrás') {
      await session.aki.back()
      session.numPregunta = Math.max(1, session.numPregunta - 1)
      await sock.sendMessage(from, { text: formatearPregunta(session) }, { quoted: msg })
      return true
    }

    // Respuesta normal a la pregunta
    if (!(texto in RESPUESTAS)) return false

    const index = RESPUESTAS[texto]
    await session.aki.step(index)

    console.log('[AKI DEBUG] progress:', session.aki.progress, 'currentStep:', session.aki.currentStep)

    // Umbral para intentar adivinar
    if (session.aki.progress >= 80) {
      await session.aki.win()
      console.log('[AKI DEBUG] win() answers:', JSON.stringify(session.aki.answers))
      const mostrado = await enviarGuess(sock, from, msg, session)
      if (mostrado) return true
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