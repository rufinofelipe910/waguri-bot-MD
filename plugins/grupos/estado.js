import { generateWAMessageContent, generateWAMessageFromContent } from '@whiskeysockets/baileys'

// Función interna para el envío de estados de grupo V2
const sendGroupStatus = async (sock, jid, options = {}) => {
  const {
    text,
    media,
    type = 'text',
    caption = '',
    mimetype,
    fileName,
    ptt = false,
    textArgb = 4292401368,
    backgroundArgb = 4283453520,
    font = 5,
    audienceType = 2,
    listName = 'Mejores Amigos',
    listEmoji = '⭐'
  } = options

  if (!sock?.relayMessage) throw new Error('sock inválido')
  if (!jid || typeof jid !== 'string') throw new Error('jid requerido')

  const contextInfo = {
    statusSourceType: 0,
    statusAttributions: [{
      AttributionData: null,
      type: 10
    }],
    isGroupStatus: true,
    statusAudienceMetadata: {
      audienceType,
      listName,
      listEmoji
    }
  }

  let innerMessage

  if (type === 'text') {
    if (!text || typeof text !== 'string') throw new Error('text requerido')
    innerMessage = {
      extendedTextMessage: {
        text,
        textArgb,
        backgroundArgb,
        font,
        previewType: 0,
        contextInfo
      }
    }
  } else {
    if (!sock?.waUploadToServer) throw new Error('waUploadToServer no disponible')
    if (!media) throw new Error('media requerida')

    const allowed = ['image', 'video', 'audio', 'document']
    if (!allowed.includes(type)) throw new Error(`type inválido: ${type}`)

    const mediaContent = {
      [type]: typeof media === 'string' ? { url: media } : media
    }

    if (caption && ['image', 'video'].includes(type)) mediaContent.caption = caption
    if (mimetype) mediaContent.mimetype = mimetype
    if (fileName && type === 'document') mediaContent.fileName = fileName
    if (type === 'audio') mediaContent.ptt = ptt

    const content = await generateWAMessageContent(mediaContent, {
      upload: sock.waUploadToServer
    })

    const messageKey = `${type}Message`
    if (!content?.[messageKey]) throw new Error(`No se pudo generar ${messageKey}`)

    content[messageKey].contextInfo = contextInfo
    innerMessage = {
      [messageKey]: content[messageKey]
    }
  }

  const message = generateWAMessageFromContent(jid, {
    groupStatusMessageV2: {
      message: innerMessage
    }
  }, {
    userJid: sock.user?.id
  })

  await sock.relayMessage(jid, message.message, {
    messageId: message.key.id
  })

  return message
}

export default {
  name: ["estadogrupo", "gstatus", "statusgrupo"], // Ajustado al formato de array sin alias
  category: 'owner',
  cooldown: 5,
  groupOnly: true,
  privateOnly: false,
  adminOnly: false,
  botAdmin: false,
  ownerOnly: true,

  async run({ conn, msg, chat, usedPrefix, command, text }) {
    try {
      const quoted = msg.quoted || null
      const mediaType = quoted?.mtype?.replace(/Message$/i, '').toLowerCase()

      if (quoted && ['image', 'video', 'audio', 'document'].includes(mediaType)) {
        const buffer = await quoted.download()
        
        await sendGroupStatus(conn, chat, {
          type: mediaType,
          media: buffer,
          caption: text || quoted.text || '',
          mimetype: quoted.mime || undefined,
          fileName: quoted.filename || undefined
        })
      } else {
        const statusText = text || quoted?.text || ''
        if (!statusText) {
          return conn.reply(chat, `❀ Escribe un texto o cita un archivo multimedia para subir como estado del grupo.\n\nEjemplo:\n${usedPrefix + command} Hola Grupo!`, msg)
        }
        
        await sendGroupStatus(conn, chat, {
          type: 'text',
          text: statusText
        })
      }

      conn.reply(chat, '> ✎ Estado del grupo enviado con éxito.', msg)
    } catch (e) {
      console.error(e)
      conn.reply(chat, `❌ Error al procesar el estado: ${e.message}`, msg)
    }
  }
}
