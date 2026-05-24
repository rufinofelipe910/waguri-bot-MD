import { db } from '../../database/db.js'

export default {
  name: ['setmeta'],
  description: 'Cambia tu marca de agua para stickers',
  category: 'misc',
  ownerOnly: false,

  async run({ senderNum, text, react, reply }) {
    await react('⚙️')

    if (!text) {
      return await reply({
        text:
          `❌ Uso:\n` +
          `*.setmeta Autor*\n` +
          `*.setmeta Pack | Autor*\n\n` +
          `Ejemplo:\n` +
          `*.setmeta DuarteXV•404*\n` +
          `*.setmeta Yuta MD | DuarteXV*`
      })
    }

    const user = db.getUser(senderNum)

    if (user.text1 || user.text2) {
      return await reply({
        text: `⚠️ Ya tienes una marca establecida.\nUsa *.delmeta* para eliminarla primero.`
      })
    }

    const texto = text.trim()

    if (texto.includes('|')) {
      const [pack, author] = texto.split('|').map(v => v.trim())

      user.text1 = pack || texto
      user.text2 = author || texto
    } else {
      user.text1 = texto
      user.text2 = texto
    }

    await reply({
      text:
        `✅ *Marca actualizada*\n\n` +
        `📦 *Pack:* ${user.text1}\n` +
        `✍️ *Autor:* ${user.text2}`
    })
  }
}