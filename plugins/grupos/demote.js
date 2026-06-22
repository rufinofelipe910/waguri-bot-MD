function cleanJid(jid = "") {
  if (!jid) return "";
  const atIndex = jid.lastIndexOf("@");
  if (atIndex === -1) return jid.split(":")[0];

  const userPart = jid.slice(0, atIndex).split(":")[0];
  const domainPart = jid.slice(atIndex + 1);

  return `${userPart}@${domainPart}`;
}

export default {
  name: ['demote', 'quitaradmin'],
  description: 'Quita el administrador a un miembro del grupo',
  category: 'grupos',
  groupOnly: true,
  botAdmin: true,

  async run({ sock, from, msg, clearGroupCache, reply, senderNum }) {
    const groupMetaReal = await sock.groupMetadata(from)
    const participants = groupMetaReal.participants || []

    const senderRaw = msg.key.participant || msg.key.remoteJid
    const senderJid = cleanJid(senderRaw)
    const senderParticipant = participants.find(p => cleanJid(p.id) === senderJid)
    const isSenderAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin'

    if (!isSenderAdmin) return await reply({ text: "❌ Solo admins del grupo pueden usar este comando." })

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.imageMessage?.contextInfo || msg.message?.videoMessage?.contextInfo
    const mentioned = contextInfo?.mentionedJid || []

    let target = null
    if (contextInfo?.participant) {
      target = contextInfo.participant
    } else if (mentioned.length > 0) {
      target = mentioned[0]
    }

    if (!target) return await reply({ text: `❌ Menciona o responde al usuario para remover su admin.` })

    const targetJid = cleanJid(target)
    const targetParticipant = participants.find(p => cleanJid(p.id) === targetJid)

    if (targetParticipant?.admin === 'superadmin') {
      return await reply({ text: `❌ No le puedes quitar el admin al creador del grupo.` })
    }

    if (targetParticipant?.admin !== 'admin') {
      return await reply({ text: `❌ Este usuario no es administrador.` })
    }

    await sock.groupParticipantsUpdate(from, [targetJid], "demote")
    clearGroupCache()

    const targetNum = targetJid.split('@')[0]
    let textoDemote = `│✐꒷★ @${targetNum} h⍺ sıdo ძᧉgꭇ⍺ძ⍺ძo ძᧉ ⍺dmını𝗌tꭇ⍺doꭇ.\n`
    textoDemote += `> acción hecha por @${senderNum}`

    await sock.sendMessage(from, {
      text: textoDemote,
      contextInfo: { mentionedJid: [targetJid, senderJid] }
    }, { quoted: msg })
  }
}