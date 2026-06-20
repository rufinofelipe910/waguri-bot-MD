export default {
  name: ['cerrar', 'close'],
  description: 'Cierra el chat del grupo solo para administradores',
  category: 'grupos',
  groupOnly: true,

  async run({ sock, from, msg, reply }) {
    const groupMetaReal = await sock.groupMetadata(from)
    const participants = groupMetaReal.participants || []

    const senderJid = msg.key.participant?.split(':')[0] + '@s.whatsapp.net' || msg.key.remoteJid?.split(':')[0] + '@s.whatsapp.net'
    const senderParticipant = participants.find(p => p.id.split(':')[0] + '@s.whatsapp.net' === senderJid)
    const isSenderAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin'

    if (!isSenderAdmin) return await reply({ text: "❌ Solo admins del grupo pueden usar este comando." })

    const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
    const botParticipant = participants.find(p => p.id.split(':')[0] + '@s.whatsapp.net' === botJid)
    const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin'

    if (!isBotAdmin) return await reply({ text: "❌ El bot necesita ser admin para cerrar el grupo." })

    try {
      await sock.groupSettingUpdate(from, 'announcement')
      await reply({ text: "🔒 ¡El grupo ha sido cerrado! Ahora solo los administradores pueden enviar mensajes." })
    } catch (e) {
      await reply({ text: `❌ Hubo un error al cerrar el grupo: ${e.message}` })
    }
  }
}
