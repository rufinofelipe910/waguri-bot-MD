export default {
  name: ['kick', 'expulsar'],
  description: 'Expulsa a un miembro del grupo',
  category: 'grupos',
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,

  async run({ sock, from, msg, groupMeta, reply }) {
    const quoted    = msg.message?.extendedTextMessage?.contextInfo
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

    let target = quoted?.participant || mentioned[0] || null

    if (!target) return await reply({ text: `❌ Menciona o responde al usuario a expulsar.` })

    const botId    = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
    const targetId = target.split(':')[0] + '@s.whatsapp.net'

    if (targetId === botId) return await reply({ text: `❌ No me puedes expulsar a mí.` })

    const participant = groupMeta?.participants?.find(p => p.id.includes(target.split('@')[0]))
    if (participant?.admin === 'superadmin') return await reply({ text: `❌ No puedo expulsar al creador del grupo.` })
    if (participant?.admin === 'admin') return await reply({ text: `❌ No puedo expulsar a un admin.` })

    try {
      await sock.groupParticipantsUpdate(from, [targetId], "remove")
    } catch (e) {
      await reply({ text: `❌ No se pudo expulsar: ${e.message}` })
    }
  }
}