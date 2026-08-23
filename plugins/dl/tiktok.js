import axios from 'axios'

const API_KEY = 'NEX-832E11D2E71E43248B668FF2'

export default {
  name: ['tiktok', 'tt'],
  description: 'Busca y descarga videos de TikTok',
  category: 'dl',
  ownerOnly: false,

  async run({ sock, from, msg, text, reply, react }) {
    try {
      if (!text) {
        return reply({ text: '🎬 pega un link de TikTok' })
      }

      await react('🔍')

      const res = await axios.get('https://nexevo.boxmine.xyz/download/tiktok', {
        params: { url: text, apikey: API_KEY },
        timeout: 30000
      })

      const body = res.data
      const data = body?.result?.data

      if (!body?.status || !data?.play) {
        await react('❌')
        return reply({ text: '❌ no pude descargar ese video, revisa el link' })
      }

      const caption =
        `🎬 ${data.title || 'Sin título'}\n\n` +
        `👤 autor › ${data.author?.nickname || 'Desconocido'}\n` +
        `⏱️ duración › ${data.duration || 'N/A'}s\n` +
        `❤️ likes › ${(data.digg_count || 0).toLocaleString()}\n` +
        `👁️ vistas › ${(data.play_count || 0).toLocaleString()}\n` +
        `💬 comentarios › ${(data.comment_count || 0).toLocaleString()}`

      const videoRes = await axios.get(data.play, {
        responseType: 'arraybuffer',
        timeout: 60000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
      const videoBuffer = Buffer.from(videoRes.data)

      await sock.sendMessage(
        from,
        {
          video: videoBuffer,
          mimetype: 'video/mp4',
          caption
        },
        { quoted: msg }
      )

      await react('✅')

    } catch (error) {
      await react('❌')
      await reply({ text: `❌ Error: ${error.message}` })
      console.error('Error en tiktok:', error)
    }
  }
}