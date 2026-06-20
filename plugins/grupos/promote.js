export default {
  name: ['promote', 'daradmin'],
  description: 'Promueve a un miembro a administrador',
  category: 'grupos',
  groupOnly: true,
  adminOnly: true,

  async run({ sock, from, msg, groupMeta, clearGroupCache, reply }) {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.imageMessage?.contextInfo || msg.message?.videoMessage?.contextInfo
    const mentioned = contextInfo?.mentionedJid || []
    
    let target = null
    if (contextInfo?.participant) {
      target = contextInfo.participant 
    } else if (mentioned.length > 0) {
      target = mentioned[0] 
    }

    if (!target) return await reply({ text: `❌ Menciona o responde al usuario para darle admin.` })

    const targetJid = target.split(':')[0] + '@s.whatsapp.net'

    const participants = groupMeta?.participants || []
    const targetParticipant = participants.find(p => p.id === targetJid)
    
    if (targetParticipant?.admin === 'admin' || targetParticipant?.admin === 'superadmin') {
      return await reply({ text: `❌ Este usuario ya es administrador.` })
    }

    try {
      await sock.groupParticipantsUpdate(from, [targetJid], "promote")
      clearGroupCache()
      await reply({ text: `✅ ¡Usuario promovido a administrador con éxito!` })
    } catch (e) {
      await reply({ text: `❌ No se pudo promover al usuario: ${e.message}` })
    }
  }
}
