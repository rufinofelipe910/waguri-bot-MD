import axios from 'axios'

function validateFacebookUrl(url) {
  try {
    url = url.trim().replace(/[^\x00-\x7F]/g, "")

    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?facebook\.com\/.+\/videos\/\d+/,
      /(?:https?:\/\/)?(?:www\.)?facebook\.com\/watch\/?\?v=\d+/,
      /(?:https?:\/\/)?(?:www\.)?facebook\.com\/reel\/\d+/,
      /(?:https?:\/\/)?fb\.watch\/[A-Za-z0-9_-]+/,
      /(?:https?:\/\/)?(?:m\.)?facebook\.com\/.+\/videos\/\d+/,
      /(?:https?:\/\/)?(?:www\.)?facebook\.com\/share\/[rv]\/[A-Za-z0-9_-]+/
    ]

    for (const pattern of patterns) {
      if (pattern.test(url)) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url
        }
        return url
      }
    }

    return null
  } catch (error) {
    console.error('Error validating Facebook URL:', error)
    return null
  }
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

async function downloadFacebookVideo(url) {
  try {
    const { data } = await axios.post('https://fdown.isuru.eu.org/info',
      { url },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 25000
      }
    )

    if (data.status !== 'success' || !data.available_formats?.length) {
      throw new Error('No se encontraron formatos disponibles')
    }

    const formatos = data.available_formats
    const mejorFormato =
      formatos.find(f => f.quality === '1080p') ||
      formatos.find(f => f.quality === '720p') ||
      formatos[0]

    return {
      videoUrl: mejorFormato.url,
      title: data.video_info?.title || 'Sin título',
      uploader: data.video_info?.uploader || 'Desconocido',
      duration: data.video_info?.duration,
      viewCount: data.video_info?.view_count
    }
  } catch (error) {
    throw new Error(`Facebook API error: ${error.message}`)
  }
}

async function descargarBuffer(url) {
  const { data } = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 60000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  })
  return Buffer.from(data)
}

export default {
  name: ['facebook', 'fb'],
  description: 'Descarga videos de Facebook',
  category: 'dl',
  groupOnly: false,

  async run({ sock, from, msg, args, usedPrefix, cmdName, reply, react }) {
    if (!args[0]) {
      return await reply({
        text: `📘 Por favor, ingresa un enlace de Facebook.\n\n📝 *Ejemplo:* ${usedPrefix}${cmdName} https://www.facebook.com/watch?v=1234567890`
      })
    }

    const facebookUrl = validateFacebookUrl(args[0])
    if (!facebookUrl) {
      return await reply({
        text: `❌ URL de Facebook inválida. Por favor verifica el enlace.\n\n✅ *URLs válidas:*\n• https://www.facebook.com/.../videos/...\n• https://www.facebook.com/watch?v=...\n• https://www.facebook.com/reel/...\n• https://www.facebook.com/share/v/...\n• https://fb.watch/...`
      })
    }

    await react('🔄')
    await reply({ text: `> ✎...Descargando video.` })

    try {
      const result = await downloadFacebookVideo(facebookUrl)

      // 📦 Descargamos el buffer real en vez de pasar la URL directa,
      // así evitamos problemas de codec/streaming que WhatsApp no
      // puede reproducir cuando se le pasa la URL fragmentada de Facebook.
      const buffer = await descargarBuffer(result.videoUrl)

      const caption = `✅ *Video de Facebook descargado*\n\n` +
        `📹 *Título:* ${result.title}\n` +
        `👤 *Autor:* ${result.uploader}\n` +
        `⏱️ *Duración:* ${formatDuration(result.duration)}\n` +
        `👁️ *Vistas:* ${result.viewCount ?? 'N/A'}`

      await sock.sendMessage(from, {
        video: buffer,
        mimetype: 'video/mp4',
        fileName: 'facebook.mp4',
        caption
      }, { quoted: msg })

      await react('✅')

    } catch (error) {
      console.error('Error en Facebook download:', error)
      await react('❌')
      await reply({
        text: `❌ Error al procesar la descarga: ${error.message}\n\n💡 *Consejos:*\n• Verifica que el video sea público\n• Intenta con un enlace diferente\n• El video podría estar restringido por región`
      })
    }
  }
}