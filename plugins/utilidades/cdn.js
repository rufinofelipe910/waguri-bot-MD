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

// Función auxiliar para limpiar y obtener el tipo real del mensaje de Baileys
function getContentType(message) {
  if (!message) return null
  const keys = Object.keys(message)
  // Filtrar propiedades comunes de Baileys que no son tipos de mensajes reales
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
  description: 'Sube archivos a Dix con Debug',
  category: 'misc',
  ownerOnly: false,

  async run({ sock, from, msg, react, reply }) {
    try {
      await react('⏳')

      // 1. Extraer el mensaje real (manejando mensajes efímeros si aplica)
      let rawMessage = msg.message
      if (rawMessage?.ephemeralMessage) {
        rawMessage = rawMessage.ephemeralMessage.message
      }

      const msgType = getContentType(rawMessage)

      // 2. Extraer el mensaje citado si existe
      const quotedContext = rawMessage?.extendedTextMessage?.contextInfo
      let quotedMessage = quotedContext?.quotedMessage
      if (quotedMessage?.ephemeralMessage) {
        quotedMessage = quotedMessage.ephemeralMessage.message
      }
      
      const quotedType = getContentType(quotedMessage)

      // --- SECCIÓN DE DEBUG ---
      let debugText = `🔍 *[DEBUG INFO]*\n`
      debugText += `• Tipo de mensaje actual: \`${msgType || 'Ninguno'}\`\n`
      debugText += `• ¿Tiene citado?: \`${quotedMessage ? 'Sí' : 'No'}\`\n`
      debugText += `• Tipo de mensaje citado: \`${quotedType || 'Ninguno'}\`\n`
      await reply({ text: debugText })
      // -------------------------

      let targetMsg = null
      let mediaInfo = null

      // Validar si el mensaje actual contiene multimedia admitida
      if (msgType && MEDIA_TYPES[msgType]) {
        targetMsg = msg
        mediaInfo = { type: msgType, ...MEDIA_TYPES[msgType] }
      } 
      // Validar si el mensaje citado contiene multimedia admitida
      else if (quotedMessage && quotedType && MEDIA_TYPES[quotedType]) {
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
          text: '❌ Responde a un archivo válido o envía uno junto al comando.\nFormatos soportados: Imágenes, Videos, Audios, Documentos, Stickers.'
        })
      }

      await reply({ text: `📥 Descargando multimedia tipo: \`${mediaInfo.type}\`...` })

      const buffer = await downloadMediaMessage(
        targetMsg,
        'buffer',
        {},
        { sock }
      )

      if (!buffer || buffer.length === 0) {
        throw new Error('El buffer descargado está vacío o es inválido.')
      }

      // Detectar tipo real por seguridad
      const detected = await fileTypeFromBuffer(buffer)
      const ext = detected?.ext || mediaInfo.ext
      const mime = detected?.mime || mediaInfo.mime
      const filename = `file_${Date.now()}.${ext}`

      await reply({ text: `🚀 Subiendo \`${filename}\` a los servidores...` })

      const result = await subirDix(buffer, filename, mime)

      if (!result || !result.data) {
        throw new Error('El servidor externo no devolvió una estructura `data` válida.')
      }

      const data = result.data

      await reply({
        text:
          `✅ *Archivo subido con éxito*\n\n` +
          `📄 *Nombre:* \`${filename}\`\n` +
          `🆔 *ID:* \`${data.id || '-'}\`\n` +
          `📏 *Tamaño:* \`${data.size || '-'}\`\n` +
          `📦 *Mime:* \`${data.mime || mime}\`\n\n` +
          `🔗 *URL:*\n${data.url || result.url || 'No provista'}`
      })

      await react('✅')

    } catch (e) {
      await react('❌')
      await reply({
        text: `❌ *Error en el proceso:* ${e.message}\n\n_Revisa la consola del servidor para más detalles._`
      })
      console.error(e)
    }
  }
}
