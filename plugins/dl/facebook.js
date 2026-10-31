import axios from 'axios'

const API_KEY = 'NEX-832E11D2E71E43248B668FF2'
const API_URL = 'https://nexevo.boxmine.xyz/download/facebook'
const MAX_MB = 100

const pickUrl = (v) => {
  const u = typeof v === 'object' ? v?.url : v
  return typeof u === 'string' && /^https?:\/\//i.test(u) ? u : null
}

const isHD = (d) => /hd|720|1080/i.test(`${d?.quality ?? ''} ${d?.resolution ?? ''} ${d?.label ?? ''}`)

// Devuelve { url, quality, item } con el mejor video disponible
const extractVideo = (body) => {
  const r = body?.result ?? body?.data ?? body?.resultado ?? body

  // Estructura esperada: result.downloads = [{ type, url, quality? }]
  if (Array.isArray(r?.downloads)) {
    const videos = r.downloads.filter((d) => d?.url && (d.type === 'video' || !d.type))
    const best = videos.find(isHD) || videos[0]
    if (best) return { url: best.url, quality: isHD(best) ? 'HD' : (best.quality || 'SD'), item: r }
  }

  // Estructuras alternativas
  const item = Array.isArray(r) ? r[0] : r
  const candidates = [
    [item?.hd, 'HD'], [item?.HD, 'HD'], [item?.video_hd, 'HD'],
    [item?.sd, 'SD'], [item?.SD, 'SD'], [item?.video_sd, 'SD'],
    [item?.download, 'N/A'], [item?.url, 'N/A'], [item?.link, 'N/A'], [item?.video, 'N/A']
  ]
  for (const [c, q] of candidates) {
    const u = pickUrl(c)
    if (u) return { url: u, quality: q, item }
  }

  return null
}

export default {
  name: ['facebook', 'fb', 'fbdl'],
  description: 'Descarga videos de Facebook',
  category: 'dl',
  ownerOnly: false,

  async run({ sock, from, msg, text, reply, react }) {
    let step = 'inicio'
    try {
      const url = (text || '').trim().split(/\s+/)[0]

      if (!url) {
        return reply({ text: '⛧ pega el link de Facebook\n\n⛧ ejemplo › .fb https://www.facebook.com/watch?v=...' })
      }

      if (!/facebook\.com|fb\.watch|fb\.com/i.test(url)) {
        return reply({ text: '⛧ ese no es un link válido de Facebook' })
      }

      await react('📥')

      step = 'API'
      const res = await axios.get(API_URL, {
        params: { url, apikey: API_KEY },
        timeout: 90000,
        validateStatus: () => true
      })

      const body = res.data
      console.log('[facebook] HTTP', res.status, JSON.stringify(body)?.slice(0, 400))

      if (res.status !== 200) {
        return reply({ text: `⛧ la API respondió ${res.status}: ${body?.error || body?.message || body?.mensaje || 'sin detalle'}` })
      }

      const video = extractVideo(body)
      if (!video) {
        return reply({ text: `⛧ la API no devolvió ningún video: ${body?.error || body?.message || 'respuesta inesperada'}` })
      }

      const title = video.item?.title ?? video.item?.caption ?? ''
      const caption =
        (title && title !== 'Facebook Media' ? `⛧ ${String(title).slice(0, 300)}\n\n` : '') +
        `⛧ calidad › ${video.quality}`

      step = 'descarga del video'
      const file = await axios.get(video.url, {
        responseType: 'arraybuffer',
        timeout: 180000,
        maxContentLength: MAX_MB * 1024 * 1024,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
      const buffer = Buffer.from(file.data)
      console.log('[facebook] bytes:', buffer.length)

      if (buffer.length < 1000) {
        throw new Error('el archivo descargado está vacío o es inválido')
      }

      step = 'envío'
      await sock.sendMessage(
        from,
        { video: buffer, mimetype: 'video/mp4', caption },
        { quoted: msg }
      )

      await react('✅')

    } catch (e) {
      console.error(`[facebook] falló en "${step}":`, e.response?.status, e.message)
      await react('❌')
      await reply({ text: `⛧ error en ${step}: ${e.message}` })
    }
  }
}