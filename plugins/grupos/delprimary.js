import { db } from '../../database/db.js'

export default {
  name: ['delprimary'],
  description: 'Quita el bot primario del grupo',
  groupOnly: true,
  ownerOnly: true,

  async run({ from, react, reply }) {
    await react('🗑️')
    const primary = db.getPrimary(from)
    if (!primary) return await reply({ text: `⚠️ Este grupo no tiene bot primario establecido.` })
    db.delPrimary(from)
    await reply({ text: `✅ Bot primario eliminado.\nTodos los bots responderán en este grupo.` })
  }
}