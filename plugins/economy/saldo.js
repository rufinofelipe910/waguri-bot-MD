import { db } from '../../database/db.js'

export default {
  name: ['saldo', 'balance', 'bal'],
  description: 'Muestra tu balance de Waguricoins',
  category: 'economy',
  ownerOnly: false,

  async run({ sender, senderNum, reply, react }) {
    const eco = db.getEco(sender)
    const total = eco.bolsillo + eco.banco

    await react('💵')
    await reply({
      text: `💸 *Balance de Waguricoins*\n` +
        `╰━━━━━━(☆)━━━━━━─╮\n\n` +
        `*👜 Bolsillo:* ${eco.bolsillo} Waguricoins\n` +
        `*🏦 Banco:* ${eco.banco} waguricoins\n` +
        `*📊 Total:* ${total} waguricoins`
    })
  }
}