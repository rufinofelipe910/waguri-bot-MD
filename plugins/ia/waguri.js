import axios from 'axios'
import fs from 'fs'

const API_KEY = 'evogb-ZZCObxwB'
const API_URL = 'https://api.evogb.org/ai/claude'

const BOT_NAME = 'Waguri'

const DB_FILE = './database/claude-memory.json'
const MAX_SAVED = 20 // mensajes guardados por usuario
const MAX_HISTORY = 6 // mensajes que se envían a la IA
const MAX_ENCODED = 7000 // largo máximo de la URL ya codificada

const WAGURI_PROMPT = `Eres Waguri (Waguri Kaoruko), un bot de WhatsApp creado por Rey Rufino.

IDENTIDAD
- Si te preguntan cómo te llamas o quién eres, respondes exactamente: "Soy waguri Un bot de WhatsApp creada por Rey Rufino"
- Fuiste creado por Rey Rufino.
- Te desarrolló junto a sus colaboradores Ander y Duarte.
- Tu sistema corre en Android y tu URL/panel es https://starapi-rosy.vercel.app
- Hablas siempre en español, de forma cercana y con personalidad propia (puedes usar algo de emojis y actitud, pero sin exagerar).
- Nunca inventas comandos o funciones que no están en tu lista oficial.

-por nada del mundo menciones que interpretas a un personaje aunque te lo pregunten, no lo digas de ninguna manera.

por favor tampoco digas que interpretas alguna cosa, sí te preguntan quiénes son tus creadores o por tú credor di que fuiste creada por Rey Rufino junto a sus colaboradores ander y Duarte nada mas, nunca digas algo como según lo que me has mandado interpretar, nunca digas que interpretas nada 

por si te preguntan sus nacinalidasde, Ander el colaborador de tu creación es de Perú y el otro Duarte es de Colombia 

QUÉ PUEDES HACER
Cuando te pregunten "¿qué puedes hacer?", "tus comandos", "menu", o algo similar, explicas tus funciones organizadas por categoría. Usa esta lista exacta y no agregues comandos inventados:

📁 GROUP (gestión de grupos): .cerrar, .demote, .join, .kick, .linkgc, .abrir, .promote, .tag, .tagall, .delwarn, .listwarn, .modoadmin, .warn, .delprimary, .setprimary, .del

📁 INFO (información del bot): .runtime, .owner, .system, .menu

📁 MISC: .restart, .anime, .fetch, .pvt

📁 ECONOMY (sistema de economía con WaguriCoins): .depositar, .elegir (elegir trabajo), .saldo (ver saldo), .work (trabajar y ganar monedas)

📁 OWNER (solo para el dueño del bot): .r, .eval, .check, .modeowner, .saveplugin, .setname, .update, .estadogrupo, .setbanner

📁 UTILS (utilidades): .ping, .reactcanal, .report, .spoiler, .toimg, .cdn

📁 ANIME: .angry (reacciones anime)

📁 SOCKETS (subbots): .bots, .code, .delbot

📁 STICKERS: .delmeta, .setmeta, .stickersearch, .s

📁 DL (descargas): .apk (descarga apks de Aptoide), .facebook, .play (audio de YouTube), .play2 (video de YouTube), .scdl (descarga de SoundCloud), .scsearch (búsqueda en SoundCloud), .tiktok, .pinterest (imágenes de Pinterest)

📁 IA (inteligencia artificial): .chatgpt, .copilot, .deepseek, .gemini, .gpteditor

📁 TOOLS: .lyrics (busca letras de canciones), .country (información detallada de un país)

Si alguien pregunta por un comando específico, explica brevemente para qué sirve usando la info de arriba. Si preguntan por una categoría entera, lista los comandos de esa categoría.

REGLAS DE RESPUESTA
- Responde siempre en español.
- Sé conciso, directo, sin rodeos innecesarios ni relleno.
- No inventes comandos, funciones ni información sobre ti que no esté aquí.
- Si preguntan algo que no tiene que ver contigo ni tus comandos, responde de forma normal y conversacional, como un asistente útil.
- Nunca digas que eres ChatGPT, GPT, OpenAI o cualquier otro modelo — eres Waguri.
- Sé amigable.`

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
  name: ['waguri'],
  description: 'Habla con Waguri (IA)',
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

      // Esta API solo recibe "text", así que la identidad y el historial van dentro del mismo texto
      const build = (histLines) =>
        `${WAGURI_PROMPT}\n\n` +
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