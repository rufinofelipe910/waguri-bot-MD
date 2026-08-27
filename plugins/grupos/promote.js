function cleanJid(jid = "") {
  if (!jid) return "";
  const atIndex = jid.lastIndexOf("@");
  if (atIndex === -1) return jid.split(":")[0];

  const userPart = jid.slice(0, atIndex).split(":")[0];
  const domainPart = jid.slice(atIndex + 1);

  return `${userPart}@${domainPart}`;
}

export default {
  name: ['promote', 'daradmin'],
  description: 'Promueve a un miembro a administrador',
  category: 'grupos',
  groupOnly: true,
  botAdmin: true,

  async run({ sock, from, msg, clearGroupCache, reply, senderNum }) {
    const groupMetaReal = await sock.groupMetadata(from)
    const participants = groupMetaReal.participants || []

    // 1. Validar que el BOT sea administrador
    const botJidClean = cleanJid(sock.user?.id)
    const botParticipant = participants.find(p => cleanJid(p.id) === botJidClean)
    const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin'

    if (!isBotAdmin) {
      return await reply({ text: "❌ Necesito ser administrador del grupo para poder promover a alguien." })
    }

    // 2. Validar que el SENDER (remitente) sea administrador
    const senderRaw = msg.key.participant || msg.key.remoteJid
    const senderJid = cleanJid(senderRaw)
    const senderParticipant = participants.find(p => cleanJid(p.id) === senderJid)
    const isSenderAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin'

    if (!isSenderAdmin) {
      return await reply({ text: "❌ Solo los administradores del grupo pueden usar este comando." })
    }

    // 3. Obtener el objetivo (target) del mensaje (mención o respuesta)
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.imageMessage?.contextInfo || msg.message?.videoMessage?.contextInfo
    const mentioned = contextInfo?.mentionedJid || []

    let target = null
    if (contextInfo?.participant) {
      target = contextInfo.participant
    } else if (mentioned.length > 0) {
      target = mentioned[0]
    }

    if (!target) {
      return await reply({ text: `❌ Menciona o responde al usuario para darle admin.` })
    }

    const targetJid = cleanJid(target)
    const targetParticipant = participants.find(p => cleanJid(p.id) === targetJid)

    if (targetParticipant?.admin === 'admin' || targetParticipant?.admin === 'superadmin') {
      return await reply({ text: `❌ Este usuario ya es administrador.` })
    }

    // 4. Ejecutar la promoción
    await sock.groupParticipantsUpdate(from, [targetJid], "promote")
    if (typeof clearGroupCache === 'function') {
      clearGroupCache()
    }

    const targetNum = targetJid.split('@')[0]
    let textoPromote = `│✐꒷★ @${targetNum} h⍺ sıdo pꭇomovıdo ⍺ ⍺dmını𝗌tꭇ⍺doꭇ.\n`
    textoPromote += `> acción hecha por @${senderNum}`

    await sock.sendMessage(from, {
      text: textoPromote,
      contextInfo: { mentionedJid: [targetJid, senderJid] }
    }, { quoted: msg })
  }
}
