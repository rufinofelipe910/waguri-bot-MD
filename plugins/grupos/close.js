export default {
  name: ['cerrar', 'close'],
  description: 'Cierra el chat del grupo solo para administradores',
  category: 'grupos',
  groupOnly: true,
  botAdmin: true,

  async run({ sock, from, msg, reply }) {
    try {
      const groupMeta = await sock.groupMetadata(from)
      const participants = groupMeta.participants || []

      // Función para limpiar JIDs
      const cleanJid = (jid = "") => {
        if (!jid) return "";
        const atIndex = jid.lastIndexOf("@");
        if (atIndex === -1) return jid.split(":")[0];
        return `${jid.slice(0, atIndex).split(":")[0]}@${jid.slice(atIndex + 1)}`;
      }

      // Validar únicamente si el usuario que ejecuta el comando es admin
      const senderRaw = msg.key.participant || msg.participant || from
      const senderJid = cleanJid(senderRaw)
      
      const senderParticipant = participants.find(p => cleanJid(p.id) === senderJid)
      const isSenderAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin'

      if (!isSenderAdmin) {
        return await reply({ text: "❌ Solo los administradores del grupo pueden usar este comando." })
      }

      // Ejecutar el cierre del grupo directamente
      await sock.groupSettingUpdate(from, 'announcement')
      await reply({ text: "꒰ 𑁍 ꒱ E𝗅 gꭇᥙ⍴o ⍺ 𝗌іძo ᥴᧉꭇꭇ⍺ძo ᥴoꭇꭇᧉƚ⍺mᧉnƚᧉ.\n> ¡Ahora solo los administradores pueden enviar mensajes!" })
      
    } catch (e) {
      console.error('Error en cerrar:', e)
      await reply({ text: `❌ Hubo un error al cerrar el grupo. Asegúrate de que el bot sea administrador.\n> Detalles: ${e.message}` })
    }
  }
}
