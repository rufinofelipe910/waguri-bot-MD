import ytdl from '@distube/ytdl-core'
import yts from 'yt-search'

const MAX_MB = 50

const formatDuration = (seconds) => {
  const s = Number(seconds) || 0
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`
}

const streamToBuffer = async (stream) => {
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  return Buffer.concat(chunks)
}

export default {
  name: ['play', 'yta', 'ytmp3', 'playaudio'],
  description: 'Descarga música de YouTube',
  category: 'dl',
  ownerOnly: false,

  async run({ sock, from, msg, text, reply, react }) {
    let step = 'inicio'
    try {
      if (!text?.trim()) {
        return reply({ text: '⛧ escribe el nombre o link del video' })
      }

      await react('🎧')

      let videoUrl = text.trim()

      step = 'búsqueda'
      if (!ytdl.validateURL(videoUrl)) {
        const search = await yts(videoUrl)
        const yt = search.videos?.[0] || search.all?.[0]
        if (!yt) return reply({ text: '⛧ no encontré resultados' })
        videoUrl = yt.url
      }

      step = 'info del video'
      const info = await ytdl.getInfo(videoUrl)
      const details = info.videoDetails

      const formats = ytdl.filterFormats(info.formats, 'audioonly')
      if (!formats.length) {
        return reply({ text: '⛧ no encontré un formato de audio disponible' })
      }

      // Preferimos m4a (mp4) porque WhatsApp lo reproduce bien; webm/opus a veces no
      const format =
        formats
          .filter((f) => f.container === 'mp4')
          .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0] ||
        ytdl.chooseFormat(formats, { quality: 'highestaudio' })

      const sizeMB = format.contentLength ? Number(format.contentLength) / (1024 * 1024) : null
      if (sizeMB && sizeMB > MAX_MB) {
        return reply({ text: `⛧ el audio pesa ${sizeMB.toFixed(1)} MB, el límite es ${MAX_MB} MB` })
      }

      const title = details.title
      const channel = details.author?.name
      const duracion = formatDuration(details.lengthSeconds)
      const thumbnail = details.thumbnails?.[details.thumbnails.length - 1]?.url
      const calidad = format.audioBitrate ? `${format.audioBitrate}kbps` : 'N/A'
      const formato = format.container || 'm4a'
      const fileName = `${title.replace(/[\\/:*?"<>|]/g, '')}.${formato === 'mp4' ? 'm4a' : formato}`

      step = 'envío de info'
      const caption =
        `⛧ ${title}\n\n` +
        `⛧ canal › ${channel || 'Desconocido'}\n` +
        `⛧ duración › ${duracion}\n` +
        `⛧ calidad › ${calidad}\n` +
        `⛧ formato › ${formato}\n` +
        `⛧ tamaño › ${sizeMB ? sizeMB.toFixed(2) + ' MB' : 'N/A'}`

      if (thumbnail) {
        await sock.sendMessage(from, { image: { url: thumbnail }, caption }, { quoted: msg })
      } else {
        await reply({ text: caption })
      }

      step = 'descarga del audio'
      const audioBuffer = await streamToBuffer(ytdl.downloadFromInfo(info, { format }))
      console.log('[play] audio bytes:', audioBuffer.length)

      if (audioBuffer.length < 1000) {
        throw new Error('el archivo descargado está vacío o es inválido')
      }

      step = 'envío del audio'
      await sock.sendMessage(
        from,
        {
          audio: audioBuffer,
          mimetype: 'audio/mp4',
          ptt: false,
          fileName
        },
        { quoted: msg }
      )

      await react('✅')

    } catch (e) {
      console.error(`[play] falló en "${step}":`, e.message)
      await react('❌')
      await reply({ text: `⛧ error en ${step}: ${e.message}` })
    }
  }
}