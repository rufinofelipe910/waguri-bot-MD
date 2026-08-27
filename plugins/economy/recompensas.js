import { db } from '../../database/db.js'

const INTERVALOS = {
  daily: 24 * 60 * 60 * 1000,    // 24 horas
  weekly: 7 * 24 * 60 * 60 * 1000, // 7 días
  monthly: 30 * 24 * 60 * 60 * 1000 // 30 días
}

const RECOMPENSAS = {
  daily: { min: 500, max: 1500, nombre: 'Diaria' },
  weekly: { min: 3500, max: 7000, nombre: 'Semanal' },
  monthly: { min: 15000, max: 30000, nombre: 'Mensual' }
}

function randomEntre(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function formatearTiempo(milisegundos) {
  const horas = Math.floor(milisegundos / (1000 * 60 * 60))
  const minutos = Math.floor((milisegundos % (1000 * 60 * 60)) / (1000 * 60))
  const segundos = Math.floor((milisegundos % (1000 * 60)) / 1000)

  if (horas > 24) {
    const dias = Math.floor(horas / 24)
    const horasRestantes = horas % 24
    return `${dias}d ${horasRestantes}h`
  }
  if (horas > 0) {
    return `${horas}h ${minutos}m`
  }
  return `${minutos}m ${segundos}s`
}

export default {
  name: ['daily', 'weekly', 'monthly', 'diaria', 'semanal', 'mensual'],
  description: 'Reclama tus recompensas gratuitas diarias, semanales o mensuales',
  category: 'economy',
  ownerOnly: false,

  async run({ sock, cmdName, sender, reply, react, usedPrefix }) {
    try {
      const eco = db.getEco(sender)
      const ahora = Date.now()

      // Identificar qué tipo de recompensa es según el alias que usó
      let tipo = 'daily'
      if (['weekly', 'semanal'].includes(cmdName)) tipo = 'weekly'
      if (['monthly', 'mensual'].includes(cmdName)) tipo = 'monthly'

      const configRecompensa = RECOMPENSAS[tipo]
      const cooldownKey = `last${tipo.charAt(0).toUpperCase() + tipo.slice(1)}` // ej: lastDaily, lastWeekly, lastMonthly
      const ultimoReclamo = eco[cooldownKey] || 0
      const tiempoRestante = INTERVALOS[tipo] - (ahora - ultimoReclamo)

      if (tiempoRestante > 0) {
        if (react) await react('⏳')
        return await reply({
          text: `⏳ *¡Ya reclamaste tu recompensa ${configRecompensa.nombre.toLowerCase()}!*\n\n` +
            `Podrás volver a reclamarla en *${formatearTiempo(tiempoRestante)}*`
        })
      }

      // Calcular cantidad aleatoria de monedas
      const ganado = randomEntre(configRecompensa.min, configRecompensa.max)
      const nuevoBolsillo = (eco.bolsillo || 0) + ganado

      // Guardar en la base de datos actualizando bolsillo y el cooldown correspondiente
      db.setEco(sender, {
        bolsillo: nuevoBolsillo,
        [cooldownKey]: ahora
      })

      if (react) await react('🎁')

      await reply({
        text: `🎁 *¡RECOMPENSA ${configRecompensa.nombre.toUpperCase()} RECLAMADA!*\n\n` +
          `✨ Ganaste: *+${ganado}* WaguriCoins\n` +
          `👜 Bolsillo actual: *${nuevoBolsillo}* WaguriCoins\n\n` +
          `> 🌸 ¡Vuelve más adelante por la siguiente!`
      })

    } catch (error) {
      console.error('Error en recompensas:', error)
      if (react) await react('❌')
      await reply({ text: `❌ Ocurrió un error al procesar tu recompensa: ${error.message}` })
    }
  }
}
