export default {
  name: ['abrir', 'open'],
  description: 'Abre el chat del grupo para todos los miembros',
  category: 'grupos',
  groupOnly: true,
  botAdmin: true,

  async run({ sock, from, msg, reply }) {
    const groupMetaReal = await sock.groupMetadata(from)
    const participants = groupMetaReal.participants || []

    // Función robusta para limpiar JIDs (preserva el dominio y elimina sufijos de dispositivos)
    const cleanJid = (jid = "") => {
      if (!jid) return "";
      const atIndex = jid.lastIndexOf("@");
      if (atIndex === -1) return jid.split(":")[0];
      const userPart = jid.slice(0, atIndex).split(":")[0];
      const domainPart = jid.slice(atIndex + 1);
      return `${userPart}@${domainPart}`;
    }

    const senderRaw = msg.key.participant || msg.participant || from
    const senderJid = cleanJid(senderRaw)
    const botJidClean = cleanJid(sock.user?.id)

    // Validar si el remitente es administrador
    const senderParticipant = participants.find(p => cleanJid(p.id) === senderJid)
    const isSenderAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin'

    if (!isSenderAdmin) {
      return await reply({ text: "❌ Solo admins del grupo pueden usar este comando." })
    }

    // Validar si el bot es administrador comparando limpiamente los JIDs o el número base
    const botParticipant = participants.find(p => {
      const pClean = cleanJid(p.id)
      return pClean === botJidClean || pClean.split('@')[0] === botJidClean.split('@')[0]
    })
    
    const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin'

    if (!isBotAdmin) {
      return await reply({ text: "❌ El bot necesita ser admin para abrir el grupo." })
    }

    try {
      await sock.groupSettingUpdate(from, 'not_announcement')
      await reply({ text: "꒰ 𑁍 ꒱ E𝗅 gꭇᥙ⍴o ⍺ 𝗌іძo ⍺ᑲiᧉꭇƚo.\n> ¡ahora todos los miembros pueden enviar mensajes!." })
    } catch (e) {
      await reply({ text: `❌ Hubo un error al abrir el grupo: ${e.message}` })
    }
  }
}
