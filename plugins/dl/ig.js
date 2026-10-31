import axios from 'axios'

const API_KEY = 'TU_API_KEY_DE_NEXEVO'
const API_URL = 'https://nexevo.boxmine.xyz/download/instagram'
const MAX_MB = 100
const MAX_ITEMS = 10

const isVideoUrl = (url, hint) => {
  if (hint) return /video|mp4|reel/i.test(String(hint))
  return /\.(mp4|mov|webm|mkv)(\?|$)/i.test(url) || /video/i.test(url)
}

const extractMedia = (body) => {
  const d = body?.data ?? body?.result ?? body?.resultado ?? body
  const list = []

  const push = (item) => {
    if (!item) return
    if (typeof item === 'string') {
      if (/^https?:\/\//i.test(item)) list.push({ url: item, video: isVideoUrl(item) })
      return
    }
    const url =
      item.url ?? item.download ?? item.downloadUrl ?? item.download_url ??
      item.link ?? item.video ?? item.image
    const finalUrl = typeof url === 'object' ? url?.url : url
    if (typeof finalUrl === 'string' && /^https?:\/\//i.test(finalUrl)) {
      list.push({ url: finalUrl, video: isVideoUrl(finalUrl, item.type ?? item.mediaType ?? item.kind) })
    }
  }

  const arr = [d?.media, d?.medias, d?.items, d?.links, d?.urls, d?.result, d].find(Array.isArray)
  if (arr) arr.forEach(push)
  else push(d)

  return [...new Map(list.map((m) => [m.url, m])).values()]
}

export default {
  name: ['instagram', 'ig', 'igdl'],
  description: 'Descarga videos, reels e imágenes de Instagram',
  category: 'dl',
  ownerOnly: false,

  async run({ sock, from, msg, text, reply, react }) {
    let step = 'inicio'
    try {
      const url = (text || '').trim().split(/\s+/)[0]

      if (!url) {
        return reply({ text: '⛧ pega el link de Instagram\n\n⛧ ejemplo › .ig https://www.instagram.com/reel/...' })
      }

      if (!/instagram\.com|instagr\.am/i.test(url)) {
        return reply({ text: '⛧ ese no es un link válido de Instagram' })
      }

      await react('📥')

      step = 'API'
      const res = await axios.get(API_URL, {
        params: { url, apikey: API_KEY },
        timeout: 90000,
        validateStatus: () => true
      })

      const body = res.data
      console.log('[instagram] HTTP', res.status, JSON.stringify(body)?.slice(0, 600))

      if (res.status !== 200) {
        return reply({ text: `⛧ la API respondió ${res.status}: ${body?.error || body?.message || body?.mensaje || 'sin detalle'}` })
      }

      const media = extractMedia(body).slice(0, MAX_ITEMS)
      if (!media.length) {
        return reply({ text: '⛧ la API no devolvió ningún archivo para ese link' })
      }

      const d = body?.data ?? body?.result ?? body
      const title = d?.title ?? d?.caption ?? d?.description ?? ''
      const caption = title ? `⛧ ${String(title).slice(0, 300)}` : undefined

      let sent = 0
      for (let i = 0; i < media.length; i++) {
        step = `descarga ${i + 1}/${media.length}`
        const file = await axios.get(media[i].url, {
          responseType: 'arraybuffer',
          timeout: 180000,
          maxContentLength: MAX_MB * 1024 * 1024,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        })
        const buffer = Buffer.from(file.data)
        console.log('[instagram] bytes:', buffer.length)

        if (buffer.length < 100) continue

        const contentType = String(file.headers['content-type'] || '')
        const isVideo = contentType.startsWith('video/') || (!contentType.startsWith('image/') && media[i].video)

        step = `envío ${i + 1}/${media.length}`
        await sock.sendMessage(
          from,
          isVideo
            ? { video: buffer, mimetype: 'video/mp4', caption: i === 0 ? caption : undefined }
            : { image: buffer, caption: i === 0 ? caption : undefined },
          { quoted: msg }
        )
        sent++
      }

      if (!sent) throw new Error('no se pudo descargar ningún archivo')

      await react('✅')

    } catch (e) {
      console.error(`[instagram] falló en "${step}":`, e.response?.status, e.message)
      await react('❌')
      await reply({ text: `⛧ error en ${step}: ${e.message}` })
    }
  }
}