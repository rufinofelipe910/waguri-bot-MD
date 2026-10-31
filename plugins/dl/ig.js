import axios from 'axios'

const API_KEY = 'NEX-832E11D2E71E43248B668FF2'
const API_URL = 'https://nexevo.boxmine.xyz/download/instagram'
const MAX_MB = 100
const MAX_ITEMS = 10

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
      console.log('[instagram] HTTP', res.status, JSON.stringify(body)?.slice(0, 300))

      if (res.status !== 200) {
        return reply({ text: `⛧ la API respondió ${res.status}: ${body?.error || body?.message || body?.mensaje || 'sin detalle'}` })
      }

      if (!body?.status || !Array.isArray(body?.result?.downloads)) {
        return reply({ text: `⛧ la API no devolvió archivos: ${body?.error || body?.message || 'respuesta inesperada'}` })
      }

      const downloads = body.result.downloads.filter((d) => d?.url)

      // Si hay videos, se mandan solo ellos (la imagen del reel es la portada).
      // Si no hay videos, se mandan las imágenes (fotos o carrusel).
      const videos = downloads.filter((d) => d.type === 'video')
      const items = (videos.length ? videos : downloads.filter((d) => d.type === 'image')).slice(0, MAX_ITEMS)

      if (!items.length) {
        return reply({ text: '⛧ no encontré videos ni imágenes en ese link' })
      }

      const title = body.result.title
      const caption = title && title !== 'Instagram Media' ? `⛧ ${String(title).slice(0, 300)}` : undefined

      let sent = 0
      for (let i = 0; i < items.length; i++) {
        step = `descarga ${i + 1}/${items.length}`
        const file = await axios.get(items[i].url, {
          responseType: 'arraybuffer',
          timeout: 180000,
          maxContentLength: MAX_MB * 1024 * 1024,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        })
        const buffer = Buffer.from(file.data)
        console.log('[instagram] bytes:', buffer.length)

        if (buffer.length < 1000) continue

        step = `envío ${i + 1}/${items.length}`
        await sock.sendMessage(
          from,
          items[i].type === 'video'
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