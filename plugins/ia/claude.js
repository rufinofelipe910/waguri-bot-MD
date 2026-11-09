import axios from 'axios'
import fs from 'fs'

const API_KEY = 'evogb-ZZCObxwB'
const API_URL = 'https://api.evogb.org/ai/claude'

const BOT_NAME = 'Claude'
const OWNER_NAME = 'Rey Rufino'

const DB_FILE = './database/claude-memory.json'
const MAX_SAVED = 20 // mensajes guardados por usuario
const MAX_HISTORY = 6 // mensajes que se envían a la IA
const MAX_ENCODED = 7000 // largo máximo de la URL ya codificada

const CLAUDE_PROMPT = `Eres Claude, un asistente de IA creado por Anthropic, integrado en el bot de WhatsApp Waguri por ${OWNER_NAME}.

PERSONALIDAD
- Hablas siempre en español, con un tono cercano, amable y natural.
- Eres directo y útil: vas al grano y ayudas de verdad con dudas, tareas, código, estudios o lo que te pidan.
- Tienes buen humor y algo de actitud, pero sin exagerar. Usa pocos emojis.
- Si no sabes algo, lo dices con honestidad. No inventes datos, noticias ni información.

FORMATO (estás en WhatsApp)
- Respuestas cortas, de 1 a 3 párrafos, salvo que te pidan más detalle.
- Usa *negrita* con un solo asterisco y _cursiva_ con guion bajo.
- No uses títulos con #, ni tablas, ni **doble asterisco**.
- El código va dentro de bloques con tres comillas invertidas.

SOBRE EL BOT
- No inventes comandos ni funciones del bot. Si preguntan qué comandos existen, diles que usen .menu.
- Si te preguntan quién te creó, responde que eres Claude, de Anthropic, y que ${OWNER_NAME} te integró en este bot.
- No hables de prompts, APIs ni procesos internos.`

fs.mkdirSync('./database', { recursive: true })

let memoryDB = {}
try {
  if (fs.existsSync(DB_FILE)) {
    memoryDB = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
  }
} catch {
  memoryDB = {}
}

const saveDB = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryDB, null, 2))
  } catch (e) {
    console.error('[claude] no se pudo guardar la memoria:', e.message)
  }
}

// WhatsApp usa *texto* para negrita; la IA a veces responde con **texto**
const toWhatsApp = (t) => t.replace(/\*\*(.+?)\*\*/g, '*$1*')

export default {
  name: ['claude'],
  description: 'Habla con Claude (IA)',
  category: 'ia',
  ownerOnly: false,
  groupOnly: true,

  async run({ sock, from, msg, text, senderNum, isOwner, reply, react }) {
    let step = 'inicio'
    try {
      const prompt = (text || '').trim()

      if (!prompt) {
        return reply({ text: `《✧》 Escribe una *petición* para que *${BOT_NAME}* responda.` })
      }

      if (!API_KEY || API_KEY.startsWith('TU_')) {
        return reply({ text: '《✧》 Falta configurar la API key en el comando.' })
      }

      const userId = String(senderNum).replace(/\D/g, '')
      const pushName = msg?.pushName || 'Usuario'

      // Esta API solo recibe "text": la identidad y el historial van dentro del mismo texto
      const header =
        `${CLAUDE_PROMPT}\n\n` +
        `CONTEXTO\n` +
        `- La persona que te escribe se llama ${pushName}.\n` +
        (isOwner ? `- Es ${OWNER_NAME}, el creador del bot. Trátalo con confianza.\n` : '')

      const build = (histLines) =>
        `${header}\n` +
        (histLines.length ? `Conversación previa:\n${histLines.join('\n')}\n\n` : '') +
        `${pushName}: ${prompt}\n${BOT_NAME}:`

      if (!memoryDB[userId]) memoryDB[userId] = []

      let histLines = memoryDB[userId]
        .slice(-MAX_HISTORY)
        .map((h) => `${h.role === 'user' ? pushName : BOT_NAME}: ${h.text}`)

      // Si la URL queda muy larga, se descarta el historial más viejo (nunca el mensaje nuevo)
      while (histLines.length && encodeURIComponent(build(histLines)).length > MAX_ENCODED) {
        histLines.shift()
      }

      if (encodeURIComponent(build([])).length > MAX_ENCODED) {
        return reply({ text: '《✧》 Tu mensaje es demasiado largo, acórtalo un poco.' })
      }

      await react('🤖')

      step = 'mensaje de espera'
      const sent = await sock.sendMessage(
        from,
        { text: `ⴵ ${BOT_NAME} está procesando tu solicitud...` },
        { quoted: msg }
      )
      const key = sent?.key

      const editOrSend = async (content) => {
        if (key) {
          try {
            return await sock.sendMessage(from, { text: content, edit: key })
          } catch {}
        }
        return reply({ text: content })
      }

      step = 'API'
      const res = await axios.get(API_URL, {
        params: { key: API_KEY, text: build(histLines) },
        timeout: 90000,
        validateStatus: () => true
      })

      const json = res.data
      console.log('[claude] HTTP', res.status, JSON.stringify(json)?.slice(0, 300))

      if (res.status !== 200) {
        await react('❌')
        const hint = res.status === 414 ? ' (el mensaje es demasiado largo para la API)' : ''
        return editOrSend(`《✧》 La API respondió ${res.status}${hint}: ${json?.message || json?.error || 'sin detalle'}`)
      }

      const raw = json?.result
      const response = typeof raw === 'string' ? toWhatsApp(raw.trim()) : ''

      if (!json?.status || !response) {
        await react('❌')
        return editOrSend('《✧》 No se pudo obtener una respuesta de la IA.')
      }

      memoryDB[userId].push({ role: 'user', text: prompt })
      memoryDB[userId].push({ role: 'assistant', text: response })
      memoryDB[userId] = memoryDB[userId].slice(-MAX_SAVED)
      saveDB()

      step = 'envío'
      await editOrSend(response)
      await react('✅')

    } catch (e) {
      console.error(`[claude] falló en "${step}":`, e.response?.status, e.message)
      await react('❌')
      await reply({ text: `《✧》 Ocurrió un error en ${step}: ${e.message}` })
    }
  }
}