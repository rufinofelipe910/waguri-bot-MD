import { downloadMediaMessage } from '@whiskeysockets/baileys'
import axios from 'axios'
import { FormData, Blob } from 'formdata-node'
import { fileTypeFromBuffer } from 'file-type'

const API_URL = 'https://api.dix.lat'

const MEDIA_TYPES = {
  imageMessage:    { ext: 'jpg',  mime: 'image/jpeg' },
  videoMessage:    { ext: 'mp4',  mime: 'video/mp4' },
  audioMessage:    { ext: 'm4a',  mime: 'audio/mp4' },
  documentMessage: { ext: 'bin',  mime: 'application/octet-stream' },
  stickerMessage:  { ext: 'webp', mime: 'image/webp' },
  ptvMessage:      { ext: 'mp4',  mime: 'video/mp4' }
}

async function subirDix(buffer, filename, mimetype) {
  const form = new FormData()

  form.append(
    'file',
    new Blob([buffer], { type: mimetype }),
    filename
  )

  const endpoint = mimetype.startsWith('image/')
    ? `${API_URL}/upload1`
    : `${API_URL}/upload2`

  const { data } = await axios.post(
    endpoint,
    form,
    {
      timeout: 120000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      headers: {
        'User-Agent': 'Drive-Client'
      }
    }
  )

  return data
}

export default {
  name: ['cdn', 'subir', 'upload'],
  description: 'Sube archivos a Dix',
  category: 'misc',
  ownerOnly: false,

  async run({ sock, from, msg, react, reply }) {
    try {
      await react('⏳')

      const msgType = Object.keys(msg.message || {})[0]

      const quoted =
        msg.message?.extendedTextMessage?.contextInfo?.quotedMessage

      const quotedType =
        quoted ? Object.keys(quoted)[0] : null

      let targetMsg = null
      let mediaInfo = null

      if (MEDIA_TYPES[msgType]) {
        targetMsg = msg
        mediaInfo = { type: msgType, ...MEDIA_TYPES[msgType] }
      } else if (quoted && MEDIA_TYPES[quotedType]) {
        targetMsg = {
          key: {
            remoteJid: from,
            id: msg.message.extendedTextMessage.contextInfo.stanzaId,
            participant:
              msg.message.extendedTextMessage.contextInfo.participant
          },
          message: quoted
        }

        mediaInfo = {
          type: quotedType,
          ...MEDIA_TYPES[quotedType]
        }
      }

      if (!targetMsg || !mediaInfo) {
        return reply({
          text: '❌ Responde o envía un archivo.'
        })
      }

      const buffer = await downloadMediaMessage(
        targetMsg,
        'buffer',
        {},
        { sock }
      )

      if (!buffer?.length) {
        throw new Error('No se pudo obtener el archivo')
      }

      const detected = await fileTypeFromBuffer(buffer)

      const ext =
        detected?.ext ||
        mediaInfo.ext

      const mime =
        detected?.mime ||
        mediaInfo.mime

      const filename =
        `file_${Date.now()}.${ext}`

      const result = await subirDix(
        buffer,
        filename,
        mime
      )

      if (!result?.status || !result?.data) {
        throw new Error(
          'Respuesta inválida del servidor'
        )
      }

      const data = result.data

      await reply({
        text:
          `✅ *Archivo subido*\n\n` +
          `📄 *Nombre:* ${filename}\n` +
          `🆔 *ID:* ${data.id || '-'}\n` +
          `📏 *Tamaño:* ${data.size || '-'}\n` +
          `📦 *Mime:* ${data.mime || mime}\n\n` +
          `🔗 *URL:*\n${data.url}`
      })

      await react('✅')

    } catch (e) {
      await react('❌')
      await reply({
        text: `❌ Error: ${e.message}`
      })
    }
  }
}