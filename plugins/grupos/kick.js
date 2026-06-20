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

    // Limpieza estricta de IDs extraídos
    const botNum = sock.user?.id?.split(':')[0].split('@')[0]
    const targetNum = target.split(':')[0].split('@')[0]

    // No expulsar al bot
    if (targetNum === botNum) return await reply({ text: `❌ No me puedes expulsar a mí.` })

    // Verificar si el bot es admin usando limpieza estricta de la lista
    const botParticipant = groupMeta?.participants?.find(p => p.id.split('@')[0].split(':')[0] === botNum)
    const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin'
    if (!isBotAdmin) return await reply({ text: `❌ El bot necesita ser admin del grupo.` })

    // Buscar al usuario objetivo en la lista usando la misma limpieza estricta
    const targetParticipant = groupMeta?.participants?.find(p => p.id.split('@')[0].split(':')[0] === targetNum)
    
    if (targetParticipant?.admin === 'superadmin') return await reply({ text: `❌ No puedo expulsar al creador del grupo.` })
    if (targetParticipant?.admin === 'admin') return await reply({ text: `❌ No puedo expulsar a un administrador.` })

    const targetId = targetNum + '@s.whatsapp.net'
    try {
      await sock.groupParticipantsUpdate(from, [targetId], "remove")
    } catch (e) {
      await reply({ text: `❌ No se pudo expulsar: ${e.message}` })
    }
  }
}
