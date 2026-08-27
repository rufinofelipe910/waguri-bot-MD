import { downloadMediaMessage } from '@whiskeysockets/baileys'

export default {
  name: ['ver', 'v', 'vv', 'once'],
  description: 'Muestra u obatene el contenido de una foto/video de una sola vista (View Once)',
  category: 'tools',
  ownerOnly: false,

  async run({ sock, msg, reply, react }) {
    try {
      // 1. Identificar si el comando es una respuesta a un mensaje de "una sola vista"
      const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage

      if (!quotedMessage) {
        return await reply({ text: "❌ Debes responder a una foto o video de **una sola vista** (View Once) con este comando." })
      }

      // 2. Extraer el objeto real del mensaje citado (puede venir dentro de viewOnceMessage o viewOnceMessageV2)
      let mediaMsg = quotedMessage.imageMessage || quotedMessage.videoMessage
      let isViewOnce = false

      if (quotedMessage.viewOnceMessage?.message) {
        mediaMsg = quotedMessage.viewOnceMessage.message.imageMessage || quotedMessage.viewOnceMessage.message.videoMessage
        isViewOnce = true
      } else if (quotedMessage.viewOnceMessageV2?.message) {
        mediaMsg = quotedMessage.viewOnceMessageV2.message.imageMessage || quotedMessage.viewOnceMessageV2.message.videoMessage
        isViewOnce = true
      } else if (quotedMessage.imageMessage?.viewOnce || quotedMessage.videoMessage?.viewOnce) {
        mediaMsg = quotedMessage.imageMessage || quotedMessage.videoMessage
        isViewOnce = true
      }

      if (!mediaMsg || !isViewOnce) {
        return await reply({ text: "❌ El mensaje al que respondiste no es un archivo de **una sola vista** válido." })
      }

      if (react) await react('📥')

      // 3. Reconstruir un objeto de mensaje temporal para que Baileys pueda descargarlo correctamente
      const type = quotedMessage.imageMessage || mediaMsg.mimetype?.includes('image') ? 'imageMessage' : 'videoMessage'
      
      const reconstructedMsg = {
        key: {
          remoteJid: msg.key.remoteJid,
          id: msg.message.extendedTextMessage.contextInfo.stanzaId,
          participant: msg.message.extendedTextMessage.contextInfo.participant
        },
        message: {
          [type]: mediaMsg
        }
      }

      // 4. Descargar el archivo multimedia en formato Buffer
      const buffer = await downloadMediaMessage(
        reconstructedMsg,
        'buffer',
        {},
        { 
          logger: console, 
          reuploadRequest: sock.updateMediaMessage 
        }
      )

      if (!buffer) {
        return await reply({ text: "❌ No se pudo descargar el archivo multimedia de una sola vista." })
      }

      const caption = mediaMsg.caption ? `💬 *Caption original:* ${mediaMsg.caption}` : ''
      const isVideo = type === 'videoMessage'

      if (react) await react('✅')

      // 5. Reenviar la imagen o video destapado al chat
      if (isVideo) {
        await sock.sendMessage(msg.key.remoteJid, {
          video: buffer,
          caption: `👁️ *¡Contenido de una sola vista revelado!*\n\n${caption}`
        }, { quoted: msg })
      } else {
        await sock.sendMessage(msg.key.remoteJid, {
          image: buffer,
          caption: `👁️ *¡Contenido de una sola vista revelado!*\n\n${caption}`
        }, { quoted: msg })
      }

    } catch (error) {
      console.error('Error al revelar view once:', error)
      if (react) await react('❌')
      await reply({ text: `❌ Ocurrió un error al intentar ver el contenido: ${error.message}` })
    }
  }
}
