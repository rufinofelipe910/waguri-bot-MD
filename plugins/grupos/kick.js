export default {
  name: ['kick', 'expulsar'],
  description: 'Expulsa a un miembro del grupo',
  category: 'grupos',
  groupOnly: true,
  adminOnly: true,

  async run({ sock, from, msg, groupMeta, reply }) {
    const quoted    = msg.message?.extendedTextMessage?.contextInfo
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

    let target = quoted?.participant || mentioned[0] || null
    if (!target) return await reply({ text: `❌ Menciona o responde al usuario a expulsar.` })

    const botNum   = sock.user?.id?.split(':')[0].split('@')[0]
    const targetNum = target.split(':')[0].split('@')[0]

    // No expulsar al bot
    if (targetNum === botNum) return await reply({ text: `❌ No me puedes expulsar a mí.` })

    // Verificar que el bot es admin
    const botParticipant = groupMeta?.participants?.find(p => p.id.includes(botNum))
    const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin'
    if (!isBotAdmin) return await reply({ text: `❌ El bot necesita ser admin del grupo.` })

    // No expulsar al creador ni admins
    const targetParticipant = groupMeta?.participants?.find(p => p.id.includes(targetNum))
    if (targetParticipant?.admin === 'superadmin') return await reply({ text: `❌ No puedo expulsar al creador del grupo.` })
    if (targetParticipant?.admin === 'admin') return await reply({ text: `❌ No puedo expulsar a un admin.` })

    const targetId = targetNum + '@s.whatsapp.net'
    try {
      await sock.groupParticipantsUpdate(from, [targetId], "remove")
    } catch (e) {
      await reply({ text: `❌ No se pudo expulsar: ${e.message}` })
    }
  }
}