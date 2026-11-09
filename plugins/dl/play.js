import axios from 'axios'
import yts from 'yt-search'

const API_KEY = 'evogb-ZZCObxwB'
const API_URL = 'https://api.evogb.org/dl/ytmp3'
const MAX_MB = 50

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
  name: ['play', 'yta', 'ytmp3', 'playaudio'],
  description: 'Descarga música de YouTube',
  category: 'dl',
  ownerOnly: false,

  async run({ sock, from, msg, text, reply, react }) {
    let step = 'inicio'
    try {
      const input = (text || '').trim()
      if (!input) {
        return reply({ text: '⛧ escribe el nombre o link del video' })
      }

      await react('🎧')

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

      // Pedir el audio a la API
      step = 'API'
      const res = await axios.get(API_URL, {
        params: { key: API_KEY, url: videoUrl },
        timeout: 90000,
        validateStatus: () => true
      })

      const body = res.data
      console.log('[play] HTTP', res.status, JSON.stringify(body)?.slice(0, 400))

      if (res.status !== 200) {
        return reply({ text: `⛧ la API respondió ${res.status}: ${body?.message || body?.error || 'sin detalle'}` })
      }

      const data = body?.data
      if (!body?.status || !data?.dl) {
        return reply({ text: `⛧ la API no devolvió el audio: ${body?.message || body?.error || 'respuesta inesperada'}` })
      }

      const title = data.title || video?.title || 'audio'
      const channel = video?.author?.name || data.author?.name || 'Desconocido'
      const duracion = data.duration ? formatDuration(data.duration) : (video?.timestamp || 'N/A')
      const calidad = data.quality || '128kbps'
      const formato = data.format || 'mp3'

      // Miniatura en jpg (la de la API viene en webp)
      const videoId = getVideoId(videoUrl)
      const thumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : (video?.thumbnail || data.thumbnail)

      step = 'envío de info'
      const caption =
        `⛧ ${title}\n\n` +
        `⛧ canal › ${channel}\n` +
        `⛧ duración › ${duracion}\n` +
        `⛧ calidad › ${calidad}\n` +
        `⛧ formato › ${formato}`

      if (thumbnail) {
        await sock.sendMessage(from, { image: { url: thumbnail }, caption }, { quoted: msg })
      } else {
        await reply({ text: caption })
      }

      // Descargar el audio
      step = 'descarga del audio'
      const audioRes = await axios.get(data.dl, {
        responseType: 'arraybuffer',
        timeout: 120000,
        maxContentLength: MAX_MB * 1024 * 1024,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
      const audioBuffer = Buffer.from(audioRes.data)
      console.log('[play] audio bytes:', audioBuffer.length)

      if (audioBuffer.length < 1000) {
        throw new Error('el archivo descargado está vacío o es inválido')
      }

      step = 'envío del audio'
      const fileName = `${title.replace(/[\\/:*?"<>|]/g, '')}.${formato}`
      await sock.sendMessage(
        from,
        { audio: audioBuffer, mimetype: 'audio/mpeg', ptt: false, fileName },
        { quoted: msg }
      )

      await react('✅')

    } catch (e) {
      console.error(`[play] falló en "${step}":`, e.response?.status, e.message)
      await react('❌')
      await reply({ text: `⛧ error en ${step}: ${e.message}` })
    }
  }
}