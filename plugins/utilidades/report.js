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
        text: "꒰✖️꒱  ᰍ Escrıᑲᧉ ᧉƖ motivo ძᧉ𝗅 ꭇᧉpoꭇƚᧉ o ꭇᧉsponძᧉ ⍺ un mᧉns⍺jᧉ.\n\n`✎..Ejemplo:` *.report* el usuario me está enviando spam"
      })
    }

    const origen = isGroup ? `Grupo: ${groupName}` : "Chat privado"

    let textoReporte = `╭━━━━━━━━━━━○\n`
    textoReporte += `│⏤͟͟͞͞🚨 *NUEVO REPORTE*\n`
    textoReporte += `│\n`
    textoReporte += `│【👤】 *𝐃𝐄:* ↷\n @${senderNum}\n`
    textoReporte += `│【📍】 *𝐎𝐫𝐢𝐠𝐞𝐧:* ${origen.startsWith("Grupo:") ? "Grupo: ↷\n \"" + groupName + "\"" : origen}\n`

    if (text) {
      textoReporte += `│【📝】 *𝐌𝐨𝐭𝐢𝐯𝐨:* ↷\n"${text}"\n`
    } else {
      textoReporte += `│【📝】 *𝐌𝐨𝐭𝐢𝐯𝐨:* ↷\n"(mensaje citado abajo)"\n`
    }

    textoReporte += `╰━━━━━━━━━━━━━○`

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