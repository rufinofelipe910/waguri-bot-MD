import { db } from '../../database/db.js'

export default {
  name: ['delprimary'],
  description: 'Quita el bot primario del grupo',
  category: 'grupos',
  groupOnly: true,
  adminOnly: true,

  async run({ from, react, reply }) {
    await react('🗑️')

    const primary = db.getPrimary(from)

    if (!primary) return await reply({
      text:
        `⚠️ *Este grupo no tiene bot primario establecido.*\n\n` +
        `💡 Usa *.setprimary* para establecer uno.\n\n` +
        `⚔️ _Yuta Okotsu MD | DuarteXV_`
    })

    db.delPrimary(from)

    await reply({
      text:
        `✅ *Bot primario eliminado*\n\n` +
        `🤖 El bot *${primary}* ya no es primario.\n` +
        `Todos los bots responderán en este grupo.\n\n` +
        `⚔️ _Yuta Okotsu MD | DuarteXV_`
    })
  }
}