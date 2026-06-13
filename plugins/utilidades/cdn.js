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

function getContentType(message) {
  if (!message) return null
  const keys = Object.keys(message)
  const type = keys.find(key => key !== 'messageContextInfo' && key !== 'senderKeyDistributionMessage')
  return type
}

async function subirDix(buffer, filename, mimetype) {
  const form = new FormData()

  form.append(
    'file',
    new Blob([buffer], { type: mimetype }),
    filename
  )

  // Lógica segura para la API: Todo lo que sea imagen (incluyendo webp/stickers) va a upload1. 
  // Videos, audios y documentos van a upload2.
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
  description: 'Sube archivos a Dix sin errores 500 o 404',
  category: 'misc',
  ownerOnly: false,

  async run({ sock, from, msg, react, reply }) {
    try {
      await react('⏳')

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
      let mediaInfo = null

      if (msgType && MEDIA_TYPES[msgType]) {
        targetMsg = msg
        mediaInfo = { type: msgType, ...MEDIA_TYPES[msgType] }
      } else if (quotedMessage && quotedType && MEDIA_TYPES[quotedType]) {
        targetMsg = {
          key: {
            remoteJid: from,
            id: quotedContext.stanzaId,
            participant: quotedContext.participant || quotedContext.remoteJid
          },
          message: quotedMessage
        }

        mediaInfo = {
          type: quotedType,
          ...MEDIA_TYPES[quotedType]
        }
      }

      if (!targetMsg || !mediaInfo) {
        return reply({
          text: '❌ Responde a un archivo válido o envía uno junto al comando.\n\n*Formatos:* Imágenes, Videos, Audios, Documentos, Stickers.'
        })
      }

      const buffer = await downloadMediaMessage(
        targetMsg,
        'buffer',
        {},
        { sock }
      )

      if (!buffer || buffer.length === 0) {
        throw new Error('No se pudo obtener el archivo (Buffer vacío)')
      }

      const detected = await fileTypeFromBuffer(buffer)
      const ext = detected?.ext || mediaInfo.ext
      const mime = detected?.mime || mediaInfo.mime
      const filename = `file_${Date.now()}.${ext}`

      const result = await subirDix(buffer, filename, mime)

      if (!result || !result.data) {
        throw new Error('El servidor de Dix no devolvió una respuesta válida.')
      }

      const data = result.data

      // --- ASIGNACIÓN DE CARPETA DEFINITIVA ---
      // El servidor guarda las imágenes normales (jpg, png) en /media/
      // Pero los stickers (webp), videos y demás van a /upload/
      const folder = (mime.startsWith('image/') && !mime.includes('webp')) ? 'media' : 'upload'

      // Construcción final de la URL usando la respuesta o el fallback exacto
      const finalUrl = data.url || result.url || data.link || `https://api.dix.lat/${folder}/${data.id || filename}`

      await reply({
        text:
          `✅ *Archivo subido con éxito*\n\n` +
          `📄 *Nombre:* \`${filename}\`\n` +
          `🆔 *ID:* \`${data.id || '-'}\`\n` +
          `📏 *Tamaño:* \`${data.size || '-'}\`\n` +
          `📦 *Mime:* \`${data.mime || mime}\`\n\n` +
          `🔗 *URL:*\n${finalUrl}`
      })

      await react('✅')

    } catch (e) {
      await react('❌')
      await reply({
        text: `❌ *Error:* ${e.message}`
      })
      console.error(e)
    }
  }
}
