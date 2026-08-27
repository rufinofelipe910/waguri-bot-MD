import axios from 'axios'
import yts from 'yt-search'

const API_KEY = 'lem_316fcbcd534c8fb6ffec8fafa112dbd0685a4370'

export default {
  name: ['play', 'yta', 'ytmp3', 'playaudio'],
  description: 'Descarga música de YouTube',
  category: 'dl',
  ownerOnly: false,

  async run({ sock, from, msg, text, reply, react }) {
    try {
      if (!text.trim()) {
        return reply({ text: '⛧ escribe el nombre o link del video' })
      }

      await react('🎧')

      let videoUrl = text

      if (!text.includes('youtube.com') && !text.includes('youtu.be')) {
        const search = await yts(text)
        const yt = search.videos?.[0] || search.all?.[0]
        if (!yt) return reply({ text: '⛧ no encontré resultados' })
        videoUrl = yt.url
      }

      const res = await axios.get('https://api.lempi.lat/dl/yta', {
        params: { url: videoUrl, apikey: API_KEY },
        timeout: 90000
      })

      const body = res.data

      if (!body?.status || !body?.datos?.url) {
        return reply({ text: '⛧ no pude obtener el audio' })
      }

      const title = body.titulo
      const thumbnail = body.miniatura
      const channel = body.canal
      const download_url = body.datos.url
      const calidad = body.datos.calidad || '320kbps'
      const formato = body.datos.extension?.replace('.', '') || 'mp3'
      const fileName = body.datos.archivo || `${title}.mp3`
      const duracion = body.duracion

      await sock.sendMessage(
        from,
        {
          image: { url: thumbnail },
          caption:
            `⛧ ${title}\n\n` +
            `⛧ canal › ${channel || 'Desconocido'}\n` +
            `⛧ duración › ${duracion || 'N/A'}\n` +
            `⛧ calidad › ${calidad}\n` +
            `⛧ formato › ${formato}\n` +
            `⛧ tamaño › ${body.datos.tamaño || 'N/A'}`
        },
        { quoted: msg }
      )

      const audioRes = await axios.get(download_url, {
        responseType: 'arraybuffer',
        timeout: 90000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
      const audioBuffer = Buffer.from(audioRes.data)

      await sock.sendMessage(
        from,
        {
          audio: audioBuffer,
          mimetype: 'audio/mpeg',
          ptt: false,
          fileName
        },
        { quoted: msg }
      )

      await react('✅')

    } catch (e) {
      console.error(e)
      await react('❌')
      await reply({ text: `⛧ ${e.message}` })
    }
  }
}