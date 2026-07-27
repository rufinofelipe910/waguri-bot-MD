// Plugins/utilidades/shazam.js
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { identifySong } from './songfinder.js'

function getContentType(message) {
  if (!message) return null
  const keys = Object.keys(message)
  return keys.find(key => key !== 'messageContextInfo' && key !== 'senderKeyDistributionMessage')
}

const MEDIA_VALIDO = ['audioMessage', 'videoMessage', 'ptvMessage']

export default {
  name: ['shazam', 'identify', 'song'],
  description: 'Identifica una canción desde un audio o video',
  category: 'utils',
  ownerOnly: false,

  async run({ sock, msg, reply, react }) {
    try {
      let rawMessage = msg.message
      if (rawMessage?.ephemeralMessage) {
        rawMessage = rawMessage.ephemeralMessage.message
      }

      const msgType = getContentType(rawMessage)
      const quotedContext = rawMessage?.extendedTextMessage?.contextInfo
      let quotedMessage = quotedContext?.quotedMessage
      if (quotedMessage?.ephemeralMessage) {
        quotedMessage = quotedMessage.ephemeralMessage.message
      }
      const quotedType = getContentType(quotedMessage)

      let targetMsg = null

      if (msgType && MEDIA_VALIDO.includes(msgType)) {
        targetMsg = msg
      } else if (quotedMessage && quotedType && MEDIA_VALIDO.includes(quotedType)) {
        targetMsg = {
          key: {
            remoteJid: msg.key.remoteJid,
            id: quotedContext.stanzaId,
            participant: quotedContext.participant || quotedContext.remoteJid
          },
          message: quotedMessage
        }
      }

      if (!targetMsg) {
        return reply({
          text: '🎧 responde (cita) o manda un audio/video junto al comando para identificar la canción'
        })
      }

      await react('🎧')

      const buffer = await downloadMediaMessage(targetMsg, 'buffer', {}, { sock })

      if (!buffer || buffer.length === 0) {
        await react('❌')
        return reply({ text: '❌ no pude descargar el archivo' })
      }

      const track = await identifySong(buffer)

      const caption =
        `🎧 *Canción identificada*\n\n` +
        `🎵 título › ${track.title || 'Desconocido'}\n` +
        `🎤 artista › ${track.artist || 'Desconocido'}\n` +
        `💿 álbum › ${track.album || 'Desconocido'}\n` +
        `📅 lanzamiento › ${track.releaseDate || 'Desconocido'}\n` +
        `🎼 género › ${track.genre || 'Desconocido'}\n` +
        `🏷️ sello › ${track.label || 'Desconocido'}`

      if (track.coverArt) {
        await sock.sendMessage(msg.key.remoteJid, { image: { url: track.coverArt }, caption }, { quoted: msg })
      } else {
        await reply({ text: caption })
      }

      await react('✅')

    } catch (error) {
      await react('❌')
      await reply({ text: `❌ Error: ${error.message}` })
      console.error('Error en shazam:', error)
    }
  }
}