import axios from 'axios'
import yts from 'yt-search'

const API_KEY = 'evogb-ZZCObxwB'
const API_URL = 'https://api.evogb.org/dl/ytmp4'
const MAX_MB = 100
const DOC_MB = 50 // por encima de esto se manda como documento

const isYoutube = (s) => /(youtube\.com|youtu\.be)/i.test(s)
const getVideoId = (s) => s.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/)?.[1]

const formatDuration = (seconds) => {
  const s = Number(seconds) || 0
  if (!s) return 'N/A'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`
}

export default {
  name: ['play2', 'ytv', 'ytmp4', 'video'],
  description: 'Descarga videos de YouTube',
  category: 'dl',
  ownerOnly: false,

  async run({ sock, from, msg, text, reply, react }) {
    let step = 'inicio'
    try {
      const input = (text || '').trim()
      if (!input) {
        return reply({ text: '⛧ escribe el nombre o link del video' })
      }

      await react('🎬')

      // Resolver el video
      step = 'búsqueda'
      let videoUrl = input
      let video = null

      if (!isYoutube(input)) {
        const search = await yts(input)
        video = search.videos?.[0] || search.all?.[0]
        if (!video) return reply({ text: '⛧ no encontré resultados' })
        videoUrl = video.url
      }

      // Pedir el video a la API
      step = 'API'
      const res = await axios.get(API_URL, {
        params: { key: API_KEY, url: videoUrl },
        timeout: 120000,
        validateStatus: () => true
      })

      const body = res.data
      console.log('[playvideo] HTTP', res.status, JSON.stringify(body)?.slice(0, 400))

      if (res.status !== 200) {
        return reply({ text: `⛧ la API respondió ${res.status}: ${body?.message || body?.error || 'sin detalle'}` })
      }

      const data = body?.data
      const dl = data?.dl ?? data?.url ?? data?.download ?? data?.link

      if (!body?.status || !dl || typeof dl !== 'string') {
        return reply({ text: `⛧ la API no devolvió el video: ${body?.message || body?.error || 'respuesta inesperada'}` })
      }

      const title = data.title || video?.title || 'video'
      const channel = video?.author?.name || data.author?.name || 'Desconocido'
      const duracion = data.duration ? formatDuration(data.duration) : (video?.timestamp || 'N/A')
      const calidad = data.quality || 'N/A'

      // Descargar el video
      step = 'descarga del video'
      await reply({ text: `⛧ ${title}\n\n⛧ descargando video...` })

      const file = await axios.get(dl, {
        responseType: 'arraybuffer',
        timeout: 300000,
        maxContentLength: MAX_MB * 1024 * 1024,
        maxBodyLength: MAX_MB * 1024 * 1024,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
      const buffer = Buffer.from(file.data)
      const sizeMB = buffer.length / (1024 * 1024)
      console.log('[playvideo] bytes:', buffer.length)

      if (buffer.length < 1000) {
        throw new Error('el archivo descargado está vacío o es inválido')
      }

      const caption =
        `⛧ ${title}\n\n` +
        `⛧ canal › ${channel}\n` +
        `⛧ duración › ${duracion}\n` +
        `⛧ calidad › ${calidad}\n` +
        `⛧ peso › ${sizeMB.toFixed(2)} MB`

      step = 'envío del video'
      if (sizeMB > DOC_MB) {
        const fileName = `${title.replace(/[\\/:*?"<>|]/g, '')}.mp4`
        await sock.sendMessage(
          from,
          { document: buffer, mimetype: 'video/mp4', fileName, caption },
          { quoted: msg }
        )
      } else {
        await sock.sendMessage(
          from,
          { video: buffer, mimetype: 'video/mp4', caption },
          { quoted: msg }
        )
      }

      await react('✅')

    } catch (e) {
      console.error(`[playvideo] falló en "${step}":`, e.response?.status, e.message)
      await react('❌')
      await reply({ text: `⛧ error en ${step}: ${e.message}` })
    }
  }
}