import { jidNormalizedUser } from '@whiskeysockets/baileys'
import { db } from '../../database/db.js'

export async function sendWelcome(sock, chatId, participants, botLabel) {
  try {
    // Verificación segura de la base de datos por si getGroup no está definido
    let groupSettings = null
    try {
      if (typeof db.getGroup === 'function') {
        groupSettings = db.getGroup(chatId)
      }
    } catch (e) {
      // Ignoramos error de DB si la tabla no existe
    }

    // Si está explícitamente desactivada
    if (groupSettings && groupSettings.welcome === false) return

    const metadata = await sock.groupMetadata(chatId).catch(() => null)
    const groupName = metadata?.subject || 'este grupo'

    for (const user of participants) {
      // Normalizamos el JID de forma segura sin importar si viene como objeto o string
      const rawUser = typeof user === 'string' ? user : (user.id || user)
      const userJid = jidNormalizedUser(rawUser)
      const userNumber = userJid.split('@')[0]

      let ppUrl
      try {
        ppUrl = await sock.profilePictureUrl(userJid, 'image')
      } catch {
        ppUrl = 'https://cdn.dix.lat/me/oupq_20260827-c91x-heg0-3ef3.jpg'
      }

      // Texto de bienvenida por defecto
      let customText = groupSettings?.welcomeText || 
        `🌸 ¡Bienvenido/a @{user} a *{group}*! 🎉\n\n✨ Nos alegra mucho tenerte por acá.\n📜 Por favor lee las reglas del grupo y pásala genial.\n\n> 🌸 Powered by 𝓡𝓮𝔂 𝓡𝓾𝚏𝚒𝓷𝓸 👑`

      // Reemplazar variables dinámicas de forma limpia
      const welcomeText = customText
        .replace(/{user}/g, `@${userNumber}`)
        .replace(/{group}/g, groupName)

      await sock.sendMessage(chatId, {
        image: { url: ppUrl },
        caption: welcomeText,
        mentions: [userJid]
      })
    }
  } catch (error) {
    console.error('Error al enviar bienvenida:', error)
  }
}
