import { db } from '../../database/db.js'

const COOLDOWN = 5 * 60 * 1000 // 5 minutos
const PROBABILIDAD_EXITO = 0.5 // 50% de éxito

const TRABAJOS_TURBIOS = [
  "bailaste de forma ridícula en la esquina",
  "vendiste pociones mágicas falsas a un callejón oscuro",
  "hiciste un show de comedia callejera muy penoso",
  "aceptaste un trabajo nocturno sumamente sospechoso"
]

const ACCIDENTES_TURBIOS = [
  "te robaron la peluca mientras trabajabas en la calle",
  "la policía te multó por alteración del orden público turbio",
  "terminaste huyendo de clientes enojados sin cobrar nada y perdiendo dinero",
  "te asaltaron saliendo del callejón nocturno"
]

function randomEntre(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export default {
  name: ['slut', 'turbio'],
  description: 'Realiza trabajos nocturnos de dudosa reputación para ganar dinero rápido',
  category: 'economy',
  ownerOnly: false,

  async run({ sender, reply, react }) {
    try {
      const eco = db.getEco(sender)
      const ahora = Date.now()
      const tiempoRestante = COOLDOWN - (ahora - (eco.lastSlut || 0))

      if (tiempoRestante > 0) {
        const mins = Math.floor(tiempoRestante / 60000)
        const segs = Math.floor((tiempoRestante % 60000) / 1000)
        return await reply({
          text: `⏳ Necesitas descansar de tus andanzas nocturnas.\n\n> Podrás volver en *${mins}m ${segs}s*`
        })
      }

      if (react) await react('💋')

      const exito = Math.random() < PROBABILIDAD_EXITO

      if (exito) {
        const ganado = randomEntre(250, 1000)
        const nuevoBolsillo = (eco.bolsillo || 0) + ganado
        const accion = TRABAJOS_TURBIOS[Math.floor(Math.random() * TRABAJOS_TURBIOS.length)]

        db.setEco(sender, { bolsillo: nuevoBolsillo, lastSlut: ahora })

        if (react) await react('💵')
        await reply({
          text: `💋 *¡Trabajo nocturno completado!*\n\n` +
            `Hiciste de todo: ${accion} y ganaste *${ganado}* WaguriCoins\n` +
            `👜 Bolsillo actual: *${nuevoBolsillo}* WaguriCoins`
        })
      } else {
        const perdida = randomEntre(150, 500)
        const perdidaReal = Math.min(perdida, eco.bolsillo || 0)
        const nuevoBolsillo = Math.max(0, (eco.bolsillo || 0) - perdidaReal)
        const accidente = ACCIDENTES_TURBIOS[Math.floor(Math.random() * ACCIDENTES_TURBIOS.length)]

        db.setEco(sender, { bolsillo: nuevoBolsillo, lastSlut: ahora })

        if (react) await react('💀')
        await reply({
          text: `💀 *¡Algo salió mal!*\n\n` +
            `Mientras ${accidente}, perdiste *${perdidaReal}* WaguriCoins en multas o reparaciones.\n` +
            `👜 Bolsillo actual: *${nuevoBolsillo}* WaguriCoins`
        })
      }
    } catch (error) {
      console.error('Error en slut:', error)
      if (react) await react('❌')
      await reply({ text: `❌ Ocurrió un error: ${error.message}` })
    }
  }
}
