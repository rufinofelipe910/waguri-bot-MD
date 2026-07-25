import axios from 'axios'

export default {
  name: ['tiktok', 'tt'],
  description: 'Busca y descarga videos de TikTok',
  category: 'dl',
  ownerOnly: false,

  async run({ sock, from, msg, text, reply, react }) {
    try {
      if (!text) {
        return reply({ text: '🎬 escribe qué video de TikTok quieres buscar' })
      }

      await react('🔍')

      const res = await axios.get('https://api.alyacore.xyz/search/tiktok', {
        params: { query: text, key: 'api-uMZCY' },
        timeout: 30000
      })

      const body = res.data
      const video = body?.data?.[0]

      if (!body?.status || !video?.dl) {
        await react('❌')
        return reply({ text: `❌ no encontré ningún video para *${text}*` })
      }

      const stats = video.stats || {}

      const caption =
        `🎬 ${video.title || 'Sin título'}\n\n` +
        `👤 autor › ${video.author?.nickname || 'Desconocido'}\n` +
        `⏱️ duración › ${video.duration || 'N/A'}\n` +
        `❤️ likes › ${stats.likes?.toLocaleString() || 0}\n` +
        `👁️ vistas › ${stats.views?.toLocaleString() || 0}\n` +
        `💬 comentarios › ${stats.comments?.toLocaleString() || 0}`

      await sock.sendMessage(
        from,
        {
          video: { url: video.dl },
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