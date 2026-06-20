export default {
  name: ['demote', 'quitaradmin'],
  description: 'Quita el administrador a un miembro del grupo',
  category: 'grupos',
  groupOnly: true,

  async run({ sock, from, msg, groupMeta, clearGroupCache, reply }) {
    // 1. Obtener metadatos en vivo para verificar al ejecutor
    const groupMetaReal = await sock.groupMetadata(from)
    const participants = groupMetaReal.participants || []

    const senderJid = msg.key.participant?.split(':')[0] + '@s.whatsapp.net' || msg.key.remoteJid?.split(':')[0] + '@s.whatsapp.net'
    const senderParticipant = participants.find(p => p.id.split(':')[0] + '@s.whatsapp.net' === senderJid)
    const isSenderAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin'

    if (!isSenderAdmin) return await reply({ text: "❌ Solo admins del grupo pueden usar este comando." })

    // 2. Identificar al objetivo
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.imageMessage?.contextInfo || msg.message?.videoMessage?.contextInfo
    const mentioned = contextInfo?.mentionedJid || []
    
    let target = null
    if (contextInfo?.participant) {
      target = contextInfo.participant 
    } else if (mentioned.length > 0) {
      target = mentioned[0] 
    }

    if (!target) return await reply({ text: `❌ Menciona o responde al usuario para remover su admin.` })

    const targetJid = target.split(':')[0] + '@s.whatsapp.net'
    
    // 3. Validar usando los participantes en vivo O los del handler por si hay retraso
    const targetParticipant = participants.find(p => p.id.split(':')[0] + '@s.whatsapp.net' === targetJid) || 
                            groupMeta?.participants?.find(p => p.id.split(':')[0] + '@s.whatsapp.net' === targetJid)
    
    // Si es superadmin (creador), protegerlo siempre
    if (targetParticipant?.admin === 'superadmin') {
      return await reply({ text: `❌ No le puedes quitar el admin al creador del grupo.` })
    }

    // Forzamos la petición de demote directamente a WhatsApp sin importar el estado local
    try {
      await sock.groupParticipantsUpdate(from, [targetJid], "demote")
      clearGroupCache()
      await reply({ text: `✅ ¡Administrador removido con éxito!` })
    } catch (e) {
      await reply({ text: `❌ No se pudo remover el admin: ${e.message}` })
    }
  }
}
