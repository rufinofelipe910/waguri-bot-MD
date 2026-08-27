import axios from 'axios'

const API_KEY = 'lem569'

export default {
  name: ['tts', 'tiktoksearch'],
  description: 'Busca videos de TikTok por texto',
  category: 'dl',
  ownerOnly: false,

  async run({ sock, from, msg, text, reply, react }) {
    try {
      if (!text) {
        return reply({ text: '🔍 escribe qué quieres buscar en TikTok' })
      }

      await react('🔍')

      const res = await axios.get('https://api.lempi.lat/search/tiktok', {
        params: { query: text, apikey: API_KEY },
        timeout: 30000
      })

      const body = res.data

      // 🔍 DEBUG TEMPORAL — por si el endpoint/params reales difieren
      console.log('[TTS DEBUG] respuesta completa:', JSON.stringify(body, null, 2))

      const resultados = body?.resultados

      if (!body?.status || !Array.isArray(resultados) || !resultados.length) {
        await react('❌')
        return reply({ text: `❌ no encontré resultados para *${text}* (ver consola para debug)` })
      }

      const video = resultados[0]

      const caption =
        `🎬 ${video.titulo || 'Sin título'}\n\n` +
        `👤 autor › ${video.autor?.nombre || 'Desconocido'}\n` +
        `⏱️ duración › ${video.duracion || 'N/A'}s\n` +
        `❤️ likes › ${(video.estadisticas?.likes || 0).toLocaleString()}\n` +
        `👁️ vistas › ${(video.estadisticas?.vistas || 0).toLocaleString()}\n` +
        `💬 comentarios › ${(video.estadisticas?.comentarios || 0).toLocaleString()}\n` +
        `🔗 link › ${video.url}`

      const videoRes = await axios.get(video.video, {
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
      console.error('Error en tts:', error)
    }
  }
}