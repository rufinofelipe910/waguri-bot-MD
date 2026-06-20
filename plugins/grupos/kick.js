export default {
  name: ['kick', 'expulsar'],
  description: 'Expulsa a un miembro del grupo',
  category: 'grupos',
  groupOnly: true,
  adminOnly: true,

  async run({ sock, from, msg, groupMeta, reply }) {
    // Detección ultra-robusta de las rutas de Baileys
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.imageMessage?.contextInfo || msg.message?.videoMessage?.contextInfo
    const mentioned = contextInfo?.mentionedJid || []
    
    let target = null

    if (contextInfo?.participant) {
      target = contextInfo.participant // Respuesta a un mensaje
    } else if (mentioned.length > 0) {
      target = mentioned[0] // Mención directa con @
    }

    if (!target) return await reply({ text: `❌ Menciona o responde al usuario a expulsar.` })

    // Limpieza estricta de IDs extraídos
    const botNum = sock.user?.id?.split(':')[0].split('@')[0]
    const targetNum = target.split(':')[0].split('@')[0]

    // No expulsar al bot
    if (targetNum === botNum) return await reply({ text: `❌ No me puedes expulsar a mí.` })

    // Verificar si el bot es admin
    const botParticipant = groupMeta?.participants?.find(p => p.id.split('@')[0].split(':')[0] === botNum)
    const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin'
    if (!isBotAdmin) return await reply({ text: `❌ El bot necesita ser admin del grupo.` })

    // Buscar al usuario objetivo en la lista
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
