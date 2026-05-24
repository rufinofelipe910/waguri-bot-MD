import axios from 'axios'
import yts from 'yt-search'

const API_KEY = 'free_key' // API KEY
const LIMIT_MB = 80

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return m.reply(`✧ Ingresa el nombre o link\n\nEjemplo:\n${usedPrefix + command} hola remix`)
  }

  await m.reply('🔍 Buscando...')

  try {
    let videoUrl = text

    if (!text.includes('youtube.com') && !text.includes('youtu.be')) {
      const search = await yts(text)

      if (!search.videos.length) {
        return m.reply('❌ No encontré resultados')
      }

      videoUrl = search.videos[0].url
    }

    const apis = [
      `https://yosoyyo-api-ofc.onrender.com/api/youtube?q=${encodeURIComponent(videoUrl)}&apiKey=${API_KEY}`,
    ]

    let data = null

    for (const api of apis) {
      for (let i = 0; i < 3; i++) {
        try {
          const res = await axios.get(api, {
            timeout: 30000
          })

          if (res.data?.result?.length) {
            data = res.data.result[0]
            break
          }
        } catch {}
      }

      if (data) break
    }

    if (!data) {
      return m.reply('❌ Error al obtener el video')
    }

    const title = data.title
    const mp4 = data.download?.mp4 || data.downloads?.mp4?.url

    const head = await axios.head(mp4)
    const size = Number(head.headers['content-length']) || 0
    const sizeMB = size / 1024 / 1024

    await conn.sendMessage(m.chat, {
      text: `🎬 ${title}\n📦 ${sizeMB.toFixed(2)} MB`,
      contextInfo: {
        externalAdReply: {
          title,
          body: 'YOSOYYO API',
          mediaType: 1,
          previewType: 0,
          renderLargerThumbnail: true,
          thumbnailUrl: 'https://i.imgur.com/JPXxVxN.jpeg',
          sourceUrl: videoUrl
        }
      }
    }, { quoted: m })

    if (sizeMB >= LIMIT_MB) {
      await conn.sendMessage(m.chat, {
        document: { url: mp4 },
        mimetype: 'video/mp4',
        fileName: `${title}.mp4`
      }, { quoted: m })
    } else {
      await conn.sendMessage(m.chat, {
        video: { url: mp4 },
        mimetype: 'video/mp4',
        fileName: `${title}.mp4`,
        caption: title
      }, { quoted: m })
    }

  } catch (e) {
    m.reply(`❌ ${e.message}`)
  }
}

handler.help = ['play2']
handler.tags = ['downloader']
handler.command = ['play2', 'ytmp4']

export default handler
