import axios from 'axios'

export default {
  name: ['ig', 'instagram', 'igdl'],
  description: 'Descarga videos o imágenes de publicaciones y reels de Instagram',
  category: 'dl',
  ownerOnly: false,

  async run({ sock, from, args, msg, reply, react }) {
    const url = args[0]

    if (!url) {
      return await reply({
        text: `🌸 Por favor, ingresa un enlace de Instagram.\n\n` +
          `✨ *Uso:* \`.ig <enlace>\`\n` +
          `📝 *Ejemplo:* \`.ig https://www.instagram.com/reel/...\``
      })
    }

    // Validar que sea un enlace de Instagram básico
    if (!url.includes('instagram.com')) {
      return await reply({
        text: `⚠️ El enlace proporcionado no parece ser de Instagram. Inténtalo de nuevo.`
      })
    }

    try {
      if (react) await react('⏳')

      const apiKey = 'lem_316fcbcd534c8fb6ffec8fafa112dbd0685a4370'
      const apiUrl = `https://api.lempi.lat/dl/instagram?url=${encodeURIComponent(url)}&apikey=${apiKey}`

      const { data } = await axios.get(apiUrl)

      if (!data || !data.status) {
        if (react) await react('❌')
        return await reply({
          text: `❌ No se pudo obtener contenido de ese enlace o la API no está disponible.`
        })
      }

      const { metadata, datos } = data
      const captionText = metadata?.caption || ''
      const username = metadata?.username || 'Desconocido'
      const likes = metadata?.likes || 0
      const comments = metadata?.comments || 0

      // Armar un texto bonito con la información obtenida
      const captionFormatted = `『📥』 *INSTAGRAM DOWNLOADER*\n\n` +
        `👤 *Usuario:* @${username}\n` +
        `❤️ *Likes:* ${likes.toLocaleString()} | 💬 *Comentarios:* ${comments}\n\n` +
        (captionText ? `📝 *Descripción:* ${captionText.slice(0, 300)}${captionText.length > 300 ? '...' : ''}\n\n` : '') +
        `> 🌸 Powered by 𝓡𝓮𝔂 𝓡𝓾𝚏𝚒𝓷𝓸 👑`

      if (react) await react('📤')

      // Verificar si hay videos disponibles
      if (datos?.videos && datos.videos.length > 0) {
        const videoUrl = datos.videos[0]
        await sock.sendMessage(
          from,
          {
            video: { url: videoUrl },
            caption: captionFormatted,
            mimetype: 'video/mp4'
          },
          { quoted: msg }
        )
      } 
      // Si no hay video pero hay imágenes
      else if (datos?.imagenes && datos.imagenes.length > 0) {
        const imageUrl = datos.imagenes[0]
        await sock.sendMessage(
          from,
          {
            image: { url: imageUrl },
            caption: captionFormatted
          },
          { quoted: msg }
        )
      } else {
        return await reply({
          text: `⚠️ No se encontraron archivos multimedia descargables en este enlace.`
        })
      }

      if (react) await react('✅')

    } catch (error) {
      console.error('Error en el comando ig:', error)
      if (react) await react('❌')
      await reply({
        text: `❌ Ocurrió un error al procesar tu solicitud: ${error.message}`
      })
    }
  }
}
