const REPORT_GROUP_ID = "120363427598752084@g.us"

export default {
  name: ["report", "reportar"],
  description: "Envía un reporte al grupo de staff",
  category: "utils",
  ownerOnly: false,

  async run({ sock, from, msg, text, reply, senderNum, isGroup, groupName }) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo

    if (!text && !quoted?.stanzaId) {
      return await reply({
        text: "❌ Escribe el motivo del reporte o responde a un mensaje.\n\n*Ejemplo:* .report el usuario me está enviando spam"
      })
    }

    const origen = isGroup ? `Grupo: ${groupName}` : "Chat privado"

    let textoReporte = `🚨 *NUEVO REPORTE*\n\n`
    textoReporte += `👤 *De:* @${senderNum}\n`
    textoReporte += `📍 *Origen:* ${origen}\n`

    if (text) {
      textoReporte += `📝 *Motivo:*\n${text}\n`
    } else {
      textoReporte += `📝 *Motivo:* (mensaje citado abajo)\n`
    }

    try {
      if (quoted?.stanzaId) {
        await sock.sendMessage(REPORT_GROUP_ID, {
          forward: {
            key: {
              remoteJid: from,
              id: quoted.stanzaId,
              participant: quoted.participant,
              fromMe: false
            },
            message: quoted.quotedMessage
          }
        })
      }

      await sock.sendMessage(REPORT_GROUP_ID, {
        text: textoReporte,
        mentions: [`${senderNum}@s.whatsapp.net`]
      })

      await reply({ text: "✅ Tu reporte fue enviado al equipo de staff. ¡Gracias!" })
    } catch (e) {
      await reply({ text: `❌ No se pudo enviar el reporte: ${e.message}` })
    }
  }
}