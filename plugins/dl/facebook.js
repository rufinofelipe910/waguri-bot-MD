import axios from 'axios'

export default {
  name: ['fb', 'facebook', 'fbdl'],
  description: 'Descarga videos de publicaciones y reels de Facebook en HD',
  category: 'dl',
  ownerOnly: false,

  async run({ sock, from, args, msg, reply, react }) {
    const url = args[0]

    if (!url) {
      return await reply({
        text: `🌸 Por favor, ingresa un enlace de Facebook.\n\n` +
          `✨ *Uso:* \`.fb <enlace>\`\n` +
          `📝 *Ejemplo:* \`.fb https://www.facebook.com/share/v/...\``
      })
    }

    // Validar que sea un enlace relacionado con Facebook
    if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
      return await reply({
        text: `⚠️ El enlace proporcionado no parece ser de Facebook. Inténtalo de nuevo.`
      })
    }

    try {
      if (react) await react('⏳')

      const apiKey = 'lem_316fcbcd534c8fb6ffec8fafa112dbd0685a4370'
      const apiUrl = `https://api.lempi.lat/dl/facebook?url=${encodeURIComponent(url)}&quality=hd&apikey=${apiKey}`

      const { data } = await axios.get(apiUrl)

      // Si la API devuelve status false o no hay datos de video
      if (!data || !data.status || !data.datos?.video) {
        if (react) await react('❌')
        const errorMsg = data?.error || data?.mensaje || 'No se pudo obtener el contenido de Facebook.'
        return await reply({
          text: `❌ *Error al descargar de Facebook*\n\n> ${errorMsg}`
        })
      }

      const { title, duration, quality, video } = data.datos

      const captionFormatted = `『📥』 *FACEBOOK DOWNLOADER*\n\n` +
        (title ? `📝 *Título:* ${title}\n` : '') +
        (duration ? `⏱️ *Duración:* ${duration}\n` : '') +
        (quality ? `📺 *Calidad:* ${quality}\n\n` : '\n') +
        `> 🌸 Powered by 𝓡𝓮𝔂 𝓡𝓾𝚏𝚒𝓷𝓸 👑`

      if (react) await react('📤')

      await sock.sendMessage(
        from,
        {
          video: { url: video },
          caption: captionFormatted,
          mimetype: 'video/mp4'
        },
        { quoted: msg }
      )

      if (react) await react('✅')

    } catch (error) {
      console.error('Error en el comando fb:', error)
      if (react) await react('❌')
      await reply({
        text: `❌ Ocurrió un error al procesar tu solicitud: ${error.message}`
      })
    }
  }
}
