import { db } from '../../database/db.js'

export default {
  name: ['depositar', 'retirar'],
  description: 'Mueve waguricoins entre bolsillo y banco',
  category: 'economy',
  ownerOnly: false,

  async run({ sender, cmdName, args, reply, react }) {
    const eco = db.getEco(sender)
    const cantidad = parseInt(args[0])

    if (!cantidad || isNaN(cantidad) || cantidad <= 0) {
      return await reply({ text: `⚠️ Especifica una cantidad válida.\n\n*Ejemplo:* .${cmdName} 500` })
    }

    if (cmdName === 'depositar') {
      if (cantidad > eco.bolsillo) {
        return await reply({ text: `❌ No tenés suficientes Fragmentos en el bolsillo.\n\n*Bolsillo:* ${eco.bolsillo} Fragmentos` })
      }

      db.setEco(sender, {
        bolsillo: eco.bolsillo - cantidad,
        banco: eco.banco + cantidad
      })

      await react('🏦')
      await reply({
        text: `🏦 *Depósito exitoso*\n\n` +
          `*Depositado:* ${cantidad} Waguricoins\n` +
          `*Bolsillo:* ${eco.bolsillo - cantidad} Waguricoins\n` +
          `*Banco:* ${eco.banco + cantidad} waguricoins`
      })

    } else if (cmdName === 'retirar') {
      if (cantidad > eco.banco) {
        return await reply({ text: `❌ No tenés suficientes Waguricoins en el banco.\n\n*Banco:* ${eco.banco} Waguricoins` })
      }

      db.setEco(sender, {
        bolsillo: eco.bolsillo + cantidad,
        banco: eco.banco - cantidad
      })

      await react('👜')
      await reply({
        text: `👜 *Retiro exitoso*\n\n` +
          `*Retirado:* ${cantidad} Waguricoins\n` +
          `*Bolsillo:* ${eco.bolsillo + cantidad} Waguricoins\n` +
          `*Banco:* ${eco.banco - cantidad} Waguricoins`
      })
    }
  }
}