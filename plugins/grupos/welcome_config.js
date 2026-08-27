import { db } from '../../database/db.js'

export default {
  name: ['welcome', 'bienvenida', 'setwelcome'],
  description: 'Activa, desactiva o edita el mensaje de bienvenida del grupo',
  category: 'grupos',
  groupOnly: true,
  adminOnly: true, // Si tu bot tiene un middleware de admins, o lo validamos manualmente abajo

  async run({ sock, from, sender, args, msg, reply, react, isGroup }) {
    if (!isGroup) {
      return await reply({ text: `⚠️ Este comando solo se puede usar en grupos.` })
    }

    // Verificar si el remitente es administrador del grupo
    const groupMetadata = await sock.groupMetadata(from).catch(() => null)
    const participants = groupMetadata?.participants || []
    const senderParticipant = participants.find(p => p.id === sender)
    const isAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin'

    if (!isAdmin) {
      return await reply({ text: `❌ Solo los administradores pueden usar este comando.` })
    }

    const action = args[0]?.toLowerCase()
    const textArg = args.slice(1).join(' ')

    // Obtener configuración actual del grupo en la BD
    let groupData = (db.getGroup && db.getGroup(from)) || { welcome: true, welcomeText: null }

    // Manejar .welcome on / off
    if (action === 'on' || action === 'off') {
      const estado = action === 'on'
      groupData.welcome = estado

      if (db.setGroup) {
        db.setGroup(from, groupData)
      } else {
        // Fallback si tu DB guarda los datos de otra forma, ajusta según tu estructura de base de datos
        // Ej: db.groups[from] = groupData
      }

      if (react) await react('✅')
      return await reply({
        text: `🌸 El sistema de bienvenida ha sido *${estado ? 'ACTIVADO' : 'DESACTIVADO'}* correctamente en este grupo.`
      })
    }

    // Manejar .setwelcome <texto>
    if (msg.message?.extendedTextMessage?.text?.startsWith('.setwelcome') || args.length > 0 && msg.body?.startsWith('.setwelcome') || groupData && args.length > 0) {
      // Si el comando se llamó como .setwelcome o el primer argumento es un texto largo para configurar
      const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
      const newWelcomeText = fullText.replace(/^\.setwelcome\s*/i, '').trim()

      if (!newWelcomeText) {
        return await reply({
          text: `🌸 *CONFIGURACIÓN DE BIENVENIDA*\n\n` +
            `✨ *Uso:* \`.welcome on\` o \`.welcome off\`\n` +
            `📝 *Editar texto:* \`.setwelcome <tu mensaje>\`\n\n` +
            `📌 *Variables disponibles:*\n` +
            `• \`{user}\` -> Menciona al nuevo usuario.\n` +
            `• \`{group}\` -> Nombre del grupo.\n\n` +
            `> 🌸 Powered by 𝓡𝓮𝔂 𝓡𝓾𝚏𝓲𝓷𝓸 👑`
        })
      }

      groupData.welcomeText = newWelcomeText
      if (db.setGroup) {
        db.setGroup(from, groupData)
      }

      if (react) await react('✨')
      return await reply({
        text: `✅ ¡Mensaje de bienvenida actualizado con éxito!\n\n*Vista previa:* \n${newWelcomeText}`
      })
    }

    // Mensaje por defecto si solo escriben .welcome sin opciones
    await reply({
      text: `🌸 *CONFIGURACIÓN DE BIENVENIDA*\n\n` +
        `✨ *Uso:* \`.welcome on\` / \`.welcome off\`\n` +
        `📝 *Editar:* \`.setwelcome <mensaje>\`\n\n` +
        `> 🌸 Powered by 𝓡𝓮𝔂 𝓡𝓾𝚏𝓲𝓷𝓸 👑`
    })
  }
}
