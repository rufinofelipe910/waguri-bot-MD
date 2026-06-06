export default {
  name: ['del', 'delete', 'eliminar'],
  description: 'Elimina un mensaje respondiendo a él',
  category: 'grupos',
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,

  async run({ sock, from, msg, reply }) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo

    if (!quoted?.stanzaId) {
      return await reply({ text: `❌ Responde al mensaje que quieres eliminar.` })
    }

    const quotedKey = {
      remoteJid: from,
      id: quoted.stanzaId,
      participant: quoted.participant || null,
    }

    try {
      await sock.sendMessage(from, { delete: quotedKey })
    } catch (e) {
      await reply({ text: `❌ No se pudo eliminar: ${e.message}` })
    }
  }
}