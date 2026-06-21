export default {
  name: ['kick', 'expulsar'],
  description: 'Expulsa a un miembro del grupo',
  category: 'grupos',
  groupOnly: true,

  async run({ sock, from, msg, clearGroupCache, reply }) {
    const groupMetaReal = await sock.groupMetadata(from)
    const participants = groupMetaReal.participants || []

    const senderJid = msg.key.participant?.split(':')[0] + '@s.whatsapp.net' || msg.key.remoteJid?.split(':')[0] + '@s.whatsapp.net'
    const senderParticipant = participants.find(p => p.id.split(':')[0] + '@s.whatsapp.net' === senderJid)
    const isSenderAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin'

    const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
    const botParticipant = participants.find(p => p.id.split(':')[0] + '@s.whatsapp.net' === botJid)
    const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin'

    // 🔍 DEBUG TEMPORAL 3
    const matchManual = participants.find(p => p.id === botJid)
    await reply({
      text:
        `🔍 *DEBUG KICK 3*\n` +
        `botParticipant (con .split): ${JSON.stringify(botParticipant)}\n` +
        `matchManual (con === directo): ${JSON.stringify(matchManual)}\n` +
        `cantidad participants: ${participants.length}\n` +
        `participants raw: ${JSON.stringify(participants.map(p => ({id: p.id, admin: p.admin})))}`
    });
    // 🔍 FIN DEBUG

    if (!isSenderAdmin) return await reply({ text: "❌ Solo admins del grupo pueden usar este comando." })

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.imageMessage?.contextInfo || msg.message?.videoMessage?.contextInfo
    const mentioned = contextInfo?.mentionedJid || []

    let target = null
    if (contextInfo?.participant) {
      target = contextInfo.participant 
    } else if (mentioned.length > 0) {
      target = mentioned[0] 
    }

    if (!target) return await reply({ text: `❌ Menciona o responde al usuario a expulsar.` })

    const targetJid = target.split(':')[0] + '@s.whatsapp.net'

    if (targetJid === botJid) return await reply({ text: `❌ No me puedes expulsar a mí.` })

    if (!isBotAdmin) return await reply({ text: `❌ El bot necesita ser admin del grupo.` })

    const targetParticipant = participants.find(p => p.id.split(':')[0] + '@s.whatsapp.net' === targetJid)
    if (targetParticipant?.admin === 'superadmin') return await reply({ text: `❌ No puedo expulsar al creador del grupo.` })
    if (targetParticipant?.admin === 'admin') return await reply({ text: `❌ No puedo expulsar a un administrador.` })

    try {
      await sock.groupParticipantsUpdate(from, [targetJid], "remove")
      clearGroupCache()
    } catch (e) {
      await reply({ text: `❌ No se pudo expulsar: ${e.message}` })
    }
  }
}