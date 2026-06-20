import { db } from "../database/db.js";

export default {
  name: ['delwarn', 'unwarn', 'quitarwarn'],
  description: 'Quita una advertencia a un miembro del grupo',
  category: 'grupos',
  groupOnly: true,

  async run({ sock, from, msg, reply }) {
    const groupMetaReal = await sock.groupMetadata(from)
    const participants = groupMetaReal.participants || []
    const cleanJid = (id) => id ? id.split('@')[0].split(':')[0] + '@s.whatsapp.net' : ''

    // 1. Verificar si el ejecutor es admin
    const senderJid = cleanJid(msg.key.participant || msg.participant || from)
    const senderParticipant = participants.find(p => cleanJid(p.id) === senderJid)
    const isSenderAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin'

    if (!isSenderAdmin) return await reply({ text: "❌ Solo admins del grupo pueden usar este comando." })

    // 2. Identificar al objetivo
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.imageMessage?.contextInfo || msg.message?.videoMessage?.contextInfo
    const mentioned = contextInfo?.mentionedJid || []
    let target = contextInfo?.participant || mentioned[0]

    if (!target) return await reply({ text: `⚠️ Menciona o responde al usuario para quitarle una advertencia.` })
    const targetJid = cleanJid(target)

    const groupData = db.getGroup(from)
    const userWarns = groupData.warns?.[targetJid] || []

    if (userWarns.length === 0) {
      return await reply({ text: `👤 @${targetJid.split('@')[0]} no tiene advertencias activas en este grupo.`, mentions: [targetJid] })
    }

    // Remover la última advertencia acumulada
    userWarns.pop()
    groupData.warns[targetJid] = userWarns

    db.setGroup(from, { warns: groupData.warns })

    await reply({ 
      text: `✅ Se ha removido una advertencia a @${targetJid.split('@')[0]}.\n📊 *Advertencias restantes:* ${userWarns.length}/3`,
      mentions: [targetJid]
    })
  }
}
