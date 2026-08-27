import axios from 'axios'

const API_KEY = 'lem_316fcbcd534c8fb6ffec8fafa112dbd0685a4370'

export default {
  name: ['tiktok', 'tt'],
  description: 'Descarga videos de TikTok',
  category: 'dl',
  ownerOnly: false,

  async run({ sock, from, msg, text, reply, react }) {
    try {
      if (!text) {
        return reply({ text: '🎬 pega un link de TikTok' })
      }

      await react('🔍')

      const res = await axios.get('https://api.lempi.lat/dl/tiktok', {
        params: { url: text, apikey: API_KEY },
        timeout: 30000
      })

      const body = res.data

      // 🔍 DEBUG TEMPORAL — por si el endpoint real difiere
      console.log('[TIKTOK DEBUG] respuesta completa:', JSON.stringify(body, null, 2))

      const videoUrl = body?.datos?.url

      if (!body?.status || !videoUrl) {
        await react('❌')
        return reply({ text: '❌ no pude descargar ese video, revisa el link (ver consola para debug)' })
      }

      const stats = body.estadisticas || {}

      const caption =
        `🎬 ${body.titulo || 'Sin título'}\n\n` +
        `👤 autor › ${body.autor?.nombre || 'Desconocido'}\n` +
        `⏱️ duración › ${body.duracion || 'N/A'}s\n` +
        `💾 calidad › ${body.datos?.calidad || 'N/A'} (${body.datos?.tamaño || 'N/A'})\n` +
        `❤️ likes › ${(stats.likes || 0).toLocaleString()}\n` +
        `👁️ vistas › ${(stats.vistas || 0).toLocaleString()}\n` +
        `💬 comentarios › ${(stats.comentarios || 0).toLocaleString()}`

      const videoRes = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
        timeout: 60000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
      const videoBuffer = Buffer.from(videoRes.data)

      await sock.sendMessage(
        from,
        { video: videoBuffer, mimetype: 'video/mp4', caption },
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