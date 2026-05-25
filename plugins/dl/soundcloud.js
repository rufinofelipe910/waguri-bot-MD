import axios from 'axios'

let cachedClientId = null
let cacheTime = 0

async function getClientId() {
  if (cachedClientId && Date.now() - cacheTime < 3600000) return cachedClientId

  const html = await axios.get('https://soundcloud.com', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' },
    timeout: 10000
  }).then(r => r.data)

  const scripts = [...html.matchAll(/src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+\.js)"/g)].map(m => m[1])

  for (const script of scripts.slice(-3)) {
    try {
      const js = await axios.get(script).then(r => r.data)
      const match = js.match(/client_id:"([a-zA-Z0-9]+)"/)
      if (match) {
        cachedClientId = match[1]
        cacheTime = Date.now()
        return cachedClientId
      }
    } catch {}
  }
  throw new Error('No se pudo obtener el client_id de SoundCloud')
}

function msToTime(ms) {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0')
  return `${m}:${s}`
}

async function buscarTrack(q) {
  const clientId = await getClientId()
  const r = await axios.get('https://api-v2.soundcloud.com/search/tracks', {
    params: { q, client_id: clientId, limit: 1 },
    timeout: 10000
  })
  return r.data.collection[0] || null
}

async function getStreamUrl(track) {
  const clientId = await getClientId()
  const transcodings = track.media?.transcodings || []
  const mp3 = transcodings.find(t => t.format?.mime_type === 'audio/mpeg' && t.format?.protocol === 'progressive')
  const hls = transcodings.find(t => t.format?.protocol === 'hls')
  const transcoding = mp3 || hls

  if (!transcoding) throw new Error('No hay stream disponible')

  const streamRes = await axios.get(transcoding.url, {
    params: { client_id: clientId },
    timeout: 10000
  })

  return { url: streamRes.data.url, isHls: !mp3 }
}

export default {
  name: ['sc', 'soundcloud', 'scloud'],
  description: 'Descarga canciones de SoundCloud',
  category: 'media',
  ownerOnly: false,

  async run({ sock, from, msg, args, text, usedPrefix, react, reply }) {
    try {
      await react('⏳')

      if (!text) return await reply({
        text: `❌ Escribe el nombre de la canción.\n\n💡 *${usedPrefix}sc bad bunny*\n💡 *${usedPrefix}sc https://soundcloud.com/artista/cancion*`
      })

      // ─── URL directa ─────────────────────────────────
      let track
      if (text.includes('soundcloud.com')) {
        const clientId = await getClientId()
        const res = await axios.get('https://api-v2.soundcloud.com/resolve', {
          params: { url: text.trim(), client_id: clientId },
          timeout: 10000
        })
        track = res.data
        if (!track || track.kind !== 'track') throw new Error('No se encontró el track')
      } else {
        // ─── Búsqueda por nombre ──────────────────────
        track = await buscarTrack(text)
        if (!track) throw new Error('No se encontró ninguna canción')
      }

      const { url, isHls } = await getStreamUrl(track)

      if (isHls) throw new Error('Este track solo tiene stream HLS, no se puede descargar directamente')

      const thumb = track.artwork_url ? track.artwork_url.replace('large', 't500x500') : null

      // ─── Descargar audio ─────────────────────────────
      const audioRes = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000
      })
      const audioBuffer = Buffer.from(audioRes.data)

      // ─── Enviar ──────────────────────────────────────
      const caption =
        `🎵 *${track.title}*\n` +
        `👤 *Artista:* ${track.user.username}\n` +
        `⏱️ *Duración:* ${msToTime(track.duration)}\n` +
        `▶️ *Plays:* ${track.playback_count?.toLocaleString() || 'N/A'}\n` +
        `❤️ *Likes:* ${track.likes_count?.toLocaleString() || 'N/A'}\n\n` +
        `⚔️ _Yuta Okotsu MD | DuarteXV_`

      if (thumb) {
        await sock.sendMessage(from, {
          image: { url: thumb },
          caption
        }, { quoted: msg })
      }

      await sock.sendMessage(from, {
        audio: audioBuffer,
        mimetype: 'audio/mp4',
        ptt: false
      }, { quoted: msg })

      await react('✅')

    } catch (error) {
      await react('❌')
      await reply({ text: `❌ Error: ${error.message}` })
      console.error('Error en soundcloud:', error)
    }
  }
}