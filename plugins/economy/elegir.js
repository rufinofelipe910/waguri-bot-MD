import { db } from '../../database/db.js'
import { TRABAJOS } from './_trabajos.js'

export default {
  name: ['elegir'],
  description: 'Elige tu trabajo para poder usar .work',
  category: 'economy',
  ownerOnly: false,

  async run({ sender, reply, args }) {
    const eco = db.getEco(sender)

    if (eco.job) {
      const actual = TRABAJOS.find(t => t.id === eco.job)
      return await reply({
        text: `🌸 Ya tenés un trabajo asignado: *${actual?.emoji || ''} ${actual?.nombre || eco.job}*\n\n` +
          `> Si querés cambiarlo, hablalo con un admin/owner.`
      })
    }

    const numero = parseInt(args?.[0])

    if (!numero || numero < 1 || numero > TRABAJOS.length) {
      const lista = TRABAJOS.map((t, i) => `*${i + 1}.* ${t.emoji} ${t.nombre}`).join('\n')
      return await reply({
        text: `🌸 Antes de trabajar debes elegir un empleo 🌸\n\n${lista}\n\n` +
          `✨ Usa *.elegir <número>* para elegir.\n📝 Ejemplo: *.elegir 1*`
      })
    }

    const trabajoElegido = TRABAJOS[numero - 1]

    db.setEco(sender, { job: trabajoElegido.id })

    await reply({
      text: `✅ Elegiste el trabajo: *${trabajoElegido.emoji} ${trabajoElegido.nombre}*\n\n` +
        `> Ya podés usar *.work* para empezar a ganar WaguriCoins.`
    })
  }
}
