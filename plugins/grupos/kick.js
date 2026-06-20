export default {
  name: ['kick', 'expulsar'],
  description: 'Expulsa a un miembro del grupo',
  category: 'grupos',
  groupOnly: true,
  adminOnly: true,

  async run({ sock, from, msg, reply }) {
    // 1. Refrescar el metadata del grupo para obtener datos en tiempo real
    const groupMeta = await sock.groupMetadata(from);
    
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.imageMessage?.contextInfo || msg.message?.videoMessage?.contextInfo
    const mentioned = contextInfo?.mentionedJid || []
    
    let target = null

    if (contextInfo?.participant) {
      target = contextInfo.participant 
    } else if (mentioned.length > 0) {
      target = mentioned[0] 
    }

    if (!target) return await reply({ text: `❌ Menciona o responde al usuario a expulsar.` })

    const botNum = sock.user?.id?.split(':')[0].split('@')[0]
    const targetNum = target.split('@')[0].split(':')[0]

    if (targetNum === botNum) return await reply({ text: `❌ No me puedes expulsar a mí.` })

    // 2. Verificar admin usando el metadata fresco
    const participants = groupMeta.participants
    const botParticipant = participants.find(p => p.id.split('@')[0].split(':')[0] === botNum)
    const targetParticipant = participants.find(p => p.id.split('@')[0].split(':')[0] === targetNum)

    // Validar bot admin
    if (!(botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin')) {
        return await reply({ text: `❌ El bot necesita ser admin del grupo.` })
    }

    // 3. Validar si el objetivo es admin (Aquí está la clave: si el objeto no tiene el admin, es falso)
    if (targetParticipant?.admin === 'superadmin') return await reply({ text: `❌ No puedo expulsar al creador del grupo.` })
    if (targetParticipant?.admin === 'admin') return await reply({ text: `❌ No puedo expulsar a un administrador.` })

    const targetId = targetNum + '@s.whatsapp.net'
    try {
      await sock.groupParticipantsUpdate(from, [targetId], "remove")
    } catch (e) {
      await reply({ text: `❌ Error: ${e.message}` })
    }
  }
}
