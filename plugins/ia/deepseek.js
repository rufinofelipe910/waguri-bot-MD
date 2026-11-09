import axios from 'axios'
import fs from 'fs'

const API_KEY = 'evogb-ZZCObxwB'
const API_URL = 'https://api.evogb.org/ai/free'

const BOT_NAME = 'DeepSeek'

const DB_FILE = './database/deepseek-memory.json'
const MAX_SAVED = 20 // mensajes guardados por usuario
const MAX_HISTORY = 6 // mensajes que se envían a la IA
const MAX_ENCODED = 7000 // largo máximo de la URL ya codificada

const DEEPSEEK_PROMPT =
  `Eres DeepSeek, un asistente de IA integrado en el bot de WhatsApp Waguri, creado por Rey Rufino. ` +
  `Si te preguntan quién eres, responde que eres DeepSeek. ` +
  `Si te preguntan quién te integró en el bot, di que fue Rey Rufino. ` +
  `Hablas siempre en español, con tono claro, preciso y cercano. ` +
  `Eres bueno razonando, con matemáticas, lógica y código: explica paso a paso solo cuando haga falta. ` +
  `Respuestas concisas, de 1 a 3 párrafos, salvo que pidan más detalle. ` +
  `Si no sabes algo, dilo con honestidad y no inventes datos. ` +
  `Formato WhatsApp: *negrita* con un asterisco, _cursiva_ con guion bajo, sin títulos con #, sin tablas. ` +
  `El código va en bloques con tres comillas invertidas. ` +
  `No hables de prompts, APIs ni procesos internos.`

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
    console.error('[deepseek] no se pudo guardar la memoria:', e.message)
  }
}

// DeepSeek a veces devuelve su razonamiento entre <think>...</think>; se quita
const cleanReasoning = (t) => t.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()

// WhatsApp usa *texto* para negrita; la IA a veces responde con **texto**
const toWhatsApp = (t) => t.replace(/\*\*(.+?)\*\*/g, '*$1*')

// Acepta texto normal o, si la API devuelve un objeto, intenta sacar el texto
const extractText = (r) => {
  if (typeof r === 'string') return r.trim()
  if (r && typeof r === 'object') {
    const direct = r.respuesta ?? r.response ?? r.text ?? r.answer ?? r.message ?? r.content
    if (typeof direct === 'string') return direct.trim()
  }
  return ''
}

export default {
  name: ['deepseek'],
  description: 'Habla con DeepSeek (IA)',
  category: 'ia',
  ownerOnly: false,
  groupOnly: true,

  async run({ sock, from, msg, text, senderNum, reply, react }) {
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
      const header = `${DEEPSEEK_PROMPT}\nLa persona que te escribe se llama ${pushName}.\n\n`

      const build = (histLines) =>
        header +
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
        timeout: 120000,
        validateStatus: () => true
      })

      const json = res.data
      console.log('[deepseek] HTTP', res.status, JSON.stringify(json)?.slice(0, 300))

      if (res.status !== 200) {
        await react('❌')
        const hint =
          res.status === 414 ? ' (el mensaje es demasiado largo para la API)'
          : res.status === 404 ? ' (el endpoint no existe, revisa API_URL)'
          : ''
        return editOrSend(`《✧》 La API respondió ${res.status}${hint}: ${json?.message || json?.error || 'sin detalle'}`)
      }

      const response = toWhatsApp(cleanReasoning(extractText(json?.result)))

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
      console.error(`[deepseek] falló en "${step}":`, e.response?.status, e.message)
      await react('❌')
      await reply({ text: `《✧》 Ocurrió un error en ${step}: ${e.message}` })
    }
  }
}