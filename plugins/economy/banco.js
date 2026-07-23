import { db } from '../../database/db.js'

const ALIAS_DEPOSITAR = ['depositar', 'd']
const ALIAS_RETIRAR   = ['retirar', 'r']

export default {
  name: [...ALIAS_DEPOSITAR, ...ALIAS_RETIRAR],
  description: 'Mueve WaguriCoins entre bolsillo y banco',
  category: 'economy',
  ownerOnly: false,

  async run({ sender, cmdName, args, reply, react, usedPrefix }) {
    const eco = db.getEco(sender)
    const esDepositar = ALIAS_DEPOSITAR.includes(cmdName)
    const accion = esDepositar ? 'depositar' : 'retirar'

    // Origen del dinero según la acción: depositar saca del bolsillo, retirar saca del banco
    const disponible = esDepositar ? eco.bolsillo : eco.banco

    // Limpiamos el input: sacamos espacios y separadores de miles (. o ,)
    const raw = (args?.[0] ?? '').toString().trim()

    let cantidad
    if (/^all$/i.test(raw)) {
      cantidad = disponible
    } else {
      const limpio = raw.replace(/[.,]/g, '')
      cantidad = parseInt(limpio, 10)
    }

    if (!cantidad || isNaN(cantidad) || cantidad <= 0) {
      return await reply({
        text: `⚠️ Especifica una cantidad válida.\n\n` +
          `*Ejemplo:* ${usedPrefix}${cmdName} 500\n` +
          `*O usa:* ${usedPrefix}${cmdName} all *(para mover todo)*`
      })
    }

    if (cantidad > disponible) {
      const origen = esDepositar ? 'bolsillo' : 'banco'
      return await reply({
        text: `❌ No tenés suficientes WaguriCoins en el ${origen}.\n\n*${origen[0].toUpperCase() + origen.slice(1)}:* ${disponible} WaguriCoins`
      })
    }

    if (esDepositar) {
      const nuevoBolsillo = eco.bolsillo - cantidad
      const nuevoBanco = eco.banco + cantidad

      db.setEco(sender, { bolsillo: nuevoBolsillo, banco: nuevoBanco })

      await react('🏦')
      await reply({
        text: `🏦 *Depósito exitoso*\n\n` +
          `*Depositado:* ${cantidad} WaguriCoins\n` +
          `*Bolsillo:* ${nuevoBolsillo} WaguriCoins\n` +
          `*Banco:* ${nuevoBanco} WaguriCoins`
      })
    } else {
      const nuevoBolsillo = eco.bolsillo + cantidad
      const nuevoBanco = eco.banco - cantidad

      db.setEco(sender, { bolsillo: nuevoBolsillo, banco: nuevoBanco })

      await react('👜')
      await reply({
        text: `👜 *Retiro exitoso*\n\n` +
          `*Retirado:* ${cantidad} WaguriCoins\n` +
          `*Bolsillo:* ${nuevoBolsillo} WaguriCoins\n` +
          `*Banco:* ${nuevoBanco} WaguriCoins`
      })
    }
  }
}
