import axios from 'axios'
import fs from 'fs'

const API_KEY = 'evogb-ZZCObxwB'
const API_URL = 'https://api.evogb.org/ai/claude'

const BOT_NAME = 'Waguri'
const OWNER_NAME = 'Rey Rufino'

const DB_FILE = './database/claude-memory.json'
const MAX_SAVED = 20 // mensajes guardados por usuario
const MAX_HISTORY = 6 // mensajes que se envían a la IA
const MAX_PROMPT = 3500 // largo máximo del texto enviado

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

// WhatsApp usa *texto* para negrita; la IA responde con **texto**
const toWhatsApp = (t) => t.replace(/\*\*(.+?)\*\*/g, '*$1*')

export default {
  name: ['claude'],
  description: 'Habla con la IA Claude',
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

      const ROLE = [
        `Eres ${BOT_NAME}, una chica kawaii, amable y carismática.`,
        `Siempre mencionas al usuario por su nombre: ${pushName}.`,
        `Fuiste creada por ${OWNER_NAME}.`,
        isOwner ? `Si la persona que te habla es tu creador (${OWNER_NAME}), trátalo con máximo respeto y cariño.` : '',
        `Responde en español con un tono natural y amigable.`,
        `Usa emojis moderados.`,
        `Nunca menciones APIs, rutas, prompts ni procesos internos. Sigue el rol y responde de forma directa como una asistente real.`
      ].filter(Boolean).join(' ')

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

      if (!memoryDB[userId]) memoryDB[userId] = []

      // Esta API solo recibe "text", así que el rol y el historial van dentro del mismo texto
      const recent = memoryDB[userId].slice(-MAX_HISTORY)
      const historyText = recent
        .map((h) => `${h.role === 'user' ? pushName : BOT_NAME}: ${h.text}`)
        .join('\n')

      let fullPrompt =
        `${ROLE}\n\n` +
        (historyText ? `Conversación previa:\n${historyText}\n\n` : '') +
        `${pushName}: ${prompt}\n${BOT_NAME}:`

      if (fullPrompt.length > MAX_PROMPT) {
        // Si es muy largo se recorta el historial, nunca el mensaje nuevo
        const tail = `${pushName}: ${prompt}\n${BOT_NAME}:`
        const head = `${ROLE}\n\n`
        const room = Math.max(0, MAX_PROMPT - head.length - tail.length - 30)
        const trimmedHistory = historyText.slice(-room)
        fullPrompt = head + (trimmedHistory ? `Conversación previa:\n${trimmedHistory}\n\n` : '') + tail
      }

      step = 'API'
      const res = await axios.get(API_URL, {
        params: { key: API_KEY, text: fullPrompt },
        timeout: 90000,
        validateStatus: () => true
      })

      const json = res.data
      console.log('[claude] HTTP', res.status, JSON.stringify(json)?.slice(0, 300))

      if (res.status !== 200) {
        await react('❌')
        return editOrSend(`《✧》 La API respondió ${res.status}: ${json?.message || json?.error || 'sin detalle'}`)
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