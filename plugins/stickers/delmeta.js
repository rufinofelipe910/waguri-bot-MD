import { db } from '../../database/db.js'

export default {
  name: ['delmeta'],
  description: 'Resetea tu marca de agua a la del bot',
  category: 'stickers',
  ownerOnly: false,

  async run({ senderNum, react, reply }) {
    await react('🗑️')

    const user = db.getUser(senderNum)

    // Si no tiene marca personalizada (es decir, son null o no existen), avisamos
    if (!user.text1 && !user.text2) {
      return await reply({
        text: `⚠️ No tienes ninguna marca establecida.`
      })
    }

    // 🌟 LA SOLUCIÓN: Seteamos a null para aplastar el valor antiguo en la DB
    db.setUser(senderNum, {
      text1: null,
      text2: null
    })

    await reply({
      text: `✅ *Marca reseteada* a la del bot\n\n📦 *Pack:* ⚔️ Yuta Okotsu MD\n✍️ *Autor:* DuarteXV`
    })

    await react('✅')
  }
}