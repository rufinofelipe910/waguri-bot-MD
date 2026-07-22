import { db } from '../../database/db.js'
import { TRABAJOS } from './_trabajos.js'

const COOLDOWN = 60 * 1000 // 1 minuto en ms

const BONUS_ITEMS = {
  'pala':              50,
  'pico':             120,
  'katana_maldita':   300,
  'cristal_dominio':  600,
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}

export default {
  name: ['work', 'trabajar'],
  description: 'Trabaja para ganar WaguriCoins',
  category: 'economy',
  ownerOnly: false,

  async run({ sender, reply, react }) {
    const eco = db.getEco(sender)

    // Si todavía no eligió trabajo, no puede trabajar
    if (!eco.job) {
      const lista = TRABAJOS.map((t, i) => `*${i + 1}.* ${t.emoji} ${t.nombre}`).join('\n')
      return await reply({
        text: `🌸 Antes de trabajar debes elegir un empleo 🌸\n\n${lista}\n\n` +
          `✨ Usa *.elegir <número>* para elegir.\n📝 Ejemplo: *.elegir 1*`
      })
    }

    const trabajoActual = TRABAJOS.find(t => t.id === eco.job)

    // Por si el trabajo guardado ya no existe en la lista (ej. cambiaste los ids)
    if (!trabajoActual) {
      db.setEco(sender, { job: null })
      return await reply({
        text: `⚠️ Tu trabajo ya no existe. Usa *.elegir* para elegir uno nuevo.`
      })
    }

    const ahora = Date.now()
    const tiempoRestante = COOLDOWN - (ahora - eco.lastWork)

    if (tiempoRestante > 0) {
      const mins = Math.floor(tiempoRestante / 60000)
      const segs = Math.floor((tiempoRestante % 60000) / 1000)
      return await reply({
        text: `⏳ Ya trabajaste recientemente.\n\n> Podés volver a trabajar en *${mins}m ${segs}s*`
      })
    }

    // Elegimos una tarea al azar dentro del trabajo asignado
    const tarea = pickRandom(trabajoActual.tareas)

    // Calculamos bonus según items en inventario
    let bonus = 0
    for (const itemId of eco.inventario) {
      bonus += BONUS_ITEMS[itemId] ?? 0
    }

    // Ganancia aleatoria (0-500, como el sistema original) + bonus de items
    const ganado = Math.floor(Math.random() * 500) + bonus

    const nuevoBolsillo = eco.bolsillo + ganado

    db.setEco(sender, {
      bolsillo: nuevoBolsillo,
      lastWork: ahora
    })

    await react('💰')
    await reply({
      text: `${trabajoActual.emoji} *${trabajoActual.nombre}*\n\n` +
        `${tarea} *${ganado}* WaguriCoins${bonus > 0 ? ` *(+${bonus} bonus de items)*` : ''}\n` +
        `👜 *Bolsillo actual:* ${nuevoBolsillo} WaguriCoins\n\n` +
        `> ⏳ Próximo trabajo en *1 minuto*`
    })
  }
}
