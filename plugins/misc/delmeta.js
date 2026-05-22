import { userMeta, defaultMeta } from './Sticker.js'

export default {
  name: ['delmeta'],
  description: 'Resetea tu marca de agua a la del bot',
  category: 'misc',
  ownerOnly: false,

  async run({ senderNum, react, reply }) {
    await react('🗑️')
    userMeta.delete(senderNum)
    await reply({ text: `✅ *Marca reseteada*\n\n📦 *Pack:* ${defaultMeta.packname}\n✍️ *Autor:* ${defaultMeta.author}` })
  }
}