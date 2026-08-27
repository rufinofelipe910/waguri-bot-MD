import { db } from '../../database/db.js'

const COOLDOWN = 5 * 60 * 1000 // 5 minutos
const PROBABILIDAD_EXITO = 0.45 // 45% de éxito

const CRIMENES_EXITOSOS = [
  "🏦 Robaste una tienda de barrio y conseguiste botín fresco de",
  "💻 Hackeaste los cajeros automáticos del centro y obtuviste",
  "🚗 Hiciste una movida chueca con autos clandestinos y ganaste",
  "💎 Le robaste la cartera a un turista despistado y encontraste"
]

const CRIMENES_FALLIDOS = [
  "🚨 ¡Te delató tu cómplice! La policía te atrapó y tuviste que pagar una fianza de",
  "💥 Activaste la alarma silenciosa de una joyería y escapaste por poco dejando una multa de",
  "🏃‍♂️ Tropiezas con una maceta huyendo de la escena y pierdes en multas",
  "👮‍♂️ Te encañonó un policía encubierto y te quitó una multa de"
]

function randomEntre(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export default {
  name: ['crime', 'crimen'],
  description: 'Comete un crimen callejero para ganar (o perder) WaguriCoins',
  category: 'economy',
  ownerOnly: false,

  async run({ sender, reply, react }) {
    try {
      const eco = db.getEco(sender)
      const ahora = Date.now()
      const tiempoRestante = COOLDOWN - (ahora - (eco.lastCrime || 0))

      if (tiempoRestante > 0) {
        const mins = Math.floor(tiempoRestante / 60000)
        const segs = Math.floor((tiempoRestante % 60000) / 1000)
        return await reply({
          text: `⏳ La policía sigue patrullando tu zona.\n\n> Vuelve a cometer crímenes en *${mins}m ${segs}s*`
        })
      }

      if (react) await react('🦹')

      const exito = Math.random() < PROBABILIDAD_EXITO

      if (exito) {
        const ganado = randomEntre(300, 1200)
        const nuevoBolsillo = (eco.bolsillo || 0) + ganado
        const mensajeCrimen = CRIMENES_EXITOSOS[Math.floor(Math.random() * CRIMENES_EXITOSOS.length)]

        db.setEco(sender, { bolsillo: nuevoBolsillo, lastCrime: ahora })

        if (react) await react('💰')
        await reply({
          text: `🦹 *¡CRIMEN EXITOSO!*\n\n` +
            `${mensajeCrimen} *${ganado}* WaguriCoins\n` +
            `👜 Bolsillo actual: *${nuevoBolsillo}* WaguriCoins`
        })
      } else {
        const multa = randomEntre(200, 700)
        const multaReal = Math.min(multa, eco.bolsillo || 0)
        const nuevoBolsillo = Math.max(0, (eco.bolsillo || 0) - multaReal)
        const mensajeFallo = CRIMENES_FALLIDOS[Math.floor(Math.random() * CRIMENES_FALLIDOS.length)]

        db.setEco(sender, { bolsillo: nuevoBolsillo, lastCrime: ahora })

        if (react) await react('🚨')
        await reply({
          text: `🚨 *¡TE ATRAPARON!*\n\n` +
            `${mensajeFallo} *${multaReal}* WaguriCoins\n` +
            `👜 Bolsillo actual: *${nuevoBolsillo}* WaguriCoins`
        })
      }
    } catch (error) {
      console.error('Error en crime:', error)
      if (react) await react('❌')
      await reply({ text: `❌ Ocurrió un error: ${error.message}` })
    }
  }
}
