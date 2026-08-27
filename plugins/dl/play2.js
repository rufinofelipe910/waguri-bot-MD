import axios from 'axios'
import yts from 'yt-search'

const API_KEY = 'lem_316fcbcd534c8fb6ffec8fafa112dbd0685a4370'
const LIMIT_MB = 80

export default {
  name: ['play2'],
  description: 'Descarga video de YouTube',
  category: 'dl',
  ownerOnly: false,

  async run({ sock, from, msg, react, reply, text }) {
    try {
      if (!text) return reply({ text: '✧ Ingresa un nombre o link' })

      await react('🔍')

      let videoUrl = text

      if (!text.includes('youtube.com') && !text.includes('youtu.be')) {
        const search = await yts(text)
        if (!search.videos.length) return reply({ text: '❌ Sin resultados' })
        videoUrl = search.videos[0].url
      }

      const res = await axios.get('https://api.lempi.lat/dl/ytv', {
        params: { url: videoUrl, apikey: API_KEY },
        timeout: 60000
      })

      const body = res.data

      if (!body?.status || !body?.datos?.url) {
        return reply({ text: '❌ Error API' })
      }

      const title = body.titulo
      const mp4 = body.datos.url
      const sizeMB = parseFloat(body.datos.tamaño) || 0

      await sock.sendMessage(from, {
        text: `🎬 ${title}\n📦 ${body.datos.tamaño}`
      }, { quoted: msg })

      const videoRes = await axios.get(mp4, {
        responseType: 'arraybuffer',
        timeout: 90000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
      const videoBuffer = Buffer.from(videoRes.data)

      if (sizeMB >= LIMIT_MB) {
        await sock.sendMessage(from, {
          document: videoBuffer,
          mimetype: 'video/mp4',
          fileName: `${title}.mp4`
        }, { quoted: msg })
      } else {
        await sock.sendMessage(from, {
          video: videoBuffer,
          mimetype: 'video/mp4',
          fileName: `${title}.mp4`,
          caption: title
        }, { quoted: msg })
      }

      await react('✅')

    } catch (error) {
      await react('❌')
      await reply({ text: `❌ Error: ${error.message}` })
    }
  }
}