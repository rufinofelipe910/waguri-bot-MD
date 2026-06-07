export default {
  name: ['del', 'delete', 'eliminar'],
  description: 'Elimina un mensaje respondiendo a él',
  category: 'grupos',
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,

  async run({ sock, from, msg, reply }) {
    const contextInfo =
      msg.message?.extendedTextMessage?.contextInfo ||
      msg.message?.imageMessage?.contextInfo ||
      msg.message?.videoMessage?.contextInfo

    if (!contextInfo?.stanzaId) {
      return await reply({
        text: '❌ Responde al mensaje que quieres eliminar.'
      })
    }

    try {
      await sock.sendMessage(from, {
        delete: {
          remoteJid: from,
          fromMe: false,
          id: contextInfo.stanzaId,
          participant: contextInfo.participant
        }
      })
    } catch (e) {
      await reply({
        text: `❌ No se pudo eliminar: ${e.message}`
      })
    }
  }
}