import { jidNormalizedUser } from '@whiskeysockets/baileys'
import { db } from '../../database/db.js'

export async function sendWelcome(sock, chatId, participants, botLabel) {
  try {
    // Verificar si la bienvenida está activa en este grupo (puedes adaptar la función a tu DB)
    // Si no tienes una tabla específica de grupos, puedes guardarlo en db.getGroup(chatId) o similar.
    let groupSettings = db.getGroup ? db.getGroup(chatId) : null
    
    // Si está explícitamente desactivada (por defecto asumiremos que está activa, o pon true)
    if (groupSettings && groupSettings.welcome === false) return

    const metadata = await sock.groupMetadata(chatId).catch(() => null)
    const groupName = metadata?.subject || 'este grupo'

    for (const user of participants) {
      const userJid = jidNormalizedUser(user)
      const userNumber = userJid.split('@')[0]

      let ppUrl
      try {
        ppUrl = await sock.profilePictureUrl(userJid, 'image')
      } catch {
        ppUrl = 'https://cdn.dix.lat/me/oupq_20260827-c91x-heg0-3ef3.jpg'
      }

      // Obtener texto personalizado o usar uno por defecto
      let customText = groupSettings?.welcomeText || 
        `🌸 ¡Bienvenido/a @${user} a *{group}*! 🎉\n\n✨ Nos alegra mucho tenerte por acá.\n📜 Por favor lee las reglas del grupo y pásala genial.\n\n> 🌸 Powered by 𝓡𝓮𝔂 𝓡𝓾𝚏𝓲𝓷𝓸 👑`

      // Reemplazar variables dinámicas
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
