import axios from 'axios'

function validateFacebookUrl(url) {
  try {
    url = url.trim().replace(/[^\x00-\x7F]/g, "")

    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?facebook\.com\/.+\/videos\/\d+/,
      /(?:https?:\/\/)?(?:www\.)?facebook\.com\/watch\/?\?v=\d+/,
      /(?:https?:\/\/)?(?:www\.)?facebook\.com\/reel\/\d+/,
      /(?:https?:\/\/)?fb\.watch\/[A-Za-z0-9_-]+/,
      /(?:https?:\/\/)?(?:m\.)?facebook\.com\/.+\/videos\/\d+/
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

async function downloadFromMultipleAPIs(url) {
  const apis = [
    { name: 'FbDown', func: () => facebookFbDown(url) },
    { name: 'Snapsave', func: () => facebookSnapsave(url) }
  ]

  for (const api of apis) {
    try {
      console.log(`🔍 Intentando con ${api.name}...`)
      const result = await api.func()

      if (result && result.videoUrl) {
        console.log(`✅ ${api.name} exitoso`)
        return result
      }
    } catch (error) {
      console.log(`❌ ${api.name} falló: ${error.message}`)
      continue
    }
  }

  return null
}

async function facebookFbDown(url) {
  try {
    const apiUrl = `https://www.fbdown.net/download.php`

    const formData = new URLSearchParams()
    formData.append('URLz', url)

    const { data: html } = await axios.post(apiUrl, formData.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': 'https://www.fbdown.net',
        'Referer': 'https://www.fbdown.net/'
      },
      timeout: 15000
    })

    const hdMatch = html.match(/href="([^"]+)"[^>]*>\s*Download Video in HD/i)
    const sdMatch = html.match(/href="([^"]+)"[^>]*>\s*Download Video in Normal/i)
    const titleMatch = html.match(/<p[^>]*class="[^"]*compact[^"]*"[^>]*>([^<]+)</i)

    const videoUrl = hdMatch?.[1] || sdMatch?.[1]

    if (videoUrl) {
      return {
        videoUrl,
        title: titleMatch ? titleMatch[1].trim() : 'Sin título'
      }
    }

    throw new Error('No video URL found in response')
  } catch (error) {
    throw new Error(`FbDown API error: ${error.message}`)
  }
}

async function facebookSnapsave(url) {
  try {
    const apiUrl = `https://snapsave.app/action.php?lang=en`

    const formData = new URLSearchParams()
    formData.append('url', url)

    const { data } = await axios.post(apiUrl, formData.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': 'https://snapsave.app',
        'Referer': 'https://snapsave.app/'
      },
      timeout: 15000
    })

    const html = typeof data === 'string' ? data : data?.data || ''

    const videoMatch = html.match(/href="([^"]*\.mp4[^"]*)"/)

    if (videoMatch && videoMatch[1]) {
      return {
        videoUrl: videoMatch[1],
        title: 'Video de Facebook'
      }
    }

    throw new Error('No video data found')
  } catch (error) {
    throw new Error(`Snapsave API error: ${error.message}`)
  }
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
        text: `❌ URL de Facebook inválida. Por favor verifica el enlace.\n\n✅ *URLs válidas:*\n• https://www.facebook.com/.../videos/...\n• https://www.facebook.com/watch?v=...\n• https://www.facebook.com/reel/...\n• https://fb.watch/...`
      })
    }

    await react('🔄')
    await reply({ text: `> ✎...Descargando video.` })

    try {
      const result = await downloadFromMultipleAPIs(facebookUrl)

      if (!result || !result.videoUrl) {
        await react('❌')
        return await reply({ text: `❌ No se pudo descargar el video. El enlace podría ser privado o no válido.` })
      }

      const { videoUrl, title } = result

      const caption = `✅ *Video de Facebook descargado*\n\n` +
        `📹 *Título:* ${title || 'Sin título'}`

      await sock.sendMessage(from, {
        video: { url: videoUrl },
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