import { db } from '../../database/db.js'

const COOLDOWN = 30 * 60 * 1000 // 30 minutos
const PROBABILIDAD_EXITO = 0.15 // 15% de éxito (muy difícil)
const MIN_BANCO_VICTIMA = 5000 // El usuario elegido al azar necesita al menos esto en el banco
const PORCENTAJE_ROBO_BANCO = [0.15, 0.35] // Roba entre 15% y 35% del banco de la víctima
const MULTA_FALLO = [800, 2000] // Si la policía te atrapa atracando el banco

function randomEntre(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export default {
  name: ['robbank', 'atracarbanco', 'asaltarbanco'],
  description: 'Intenta dar el golpe del siglo atracando el banco (Muy difícil)',
  category: 'economy',
  ownerOnly: false,

  async run({ sender, reply, react }) {
    try {
      const allUsers = db.getAllUsers()
      const ecoLadron = db.getEco(sender)
      const ahora = Date.now()

      const tiempoRestante = COOLDOWN - (ahora - (ecoLadron.lastRobBank || 0))
      if (tiempoRestante > 0) {
        const mins = Math.floor(tiempoRestante / 60000)
        const segs = Math.floor((tiempoRestante % 60000) / 1000)
        return await reply({
          text: `⏳ La seguridad del banco está en máxima alerta tras tu último intento.\n\n> Podrás planear otro golpe en *${mins}m ${segs}s*`
        })
      }

      // Filtrar usuarios elegibles que tengan suficiente dinero en el banco y no seas tú mismo
      const victimasElegibles = allUsers.filter(u => {
        const bancoUser = u.banco ?? 0
        return u.jid !== sender && bancoUser >= MIN_BANCO_VICTIMA
      })

      if (victimasElegibles.length === 0) {
        return await reply({
          text: `🏦 *¡El banco está blindado y vacío!* No hay ningún ciudadano con suficientes ahorros (mínimo ${MIN_BANCO_VICTIMA} WaguriCoins en el banco) para valer la pena un asalto.`
        })
      }

      // Elegir una víctima al azar
      const victima = victimasElegibles[Math.floor(Math.random() * victimasElegibles.length)]
      const ecoVictima = db.getEco(victima.jid)

      if (react) await react('🏦')

      const exito = Math.random() < PROBABILIDAD_EXITO

      if (exito) {
        // Cálculo del botín del banco
        const porcentaje = Math.random() * (PORCENTAJE_ROBO_BANCO[1] - PORCENTAJE_ROBO_BANCO[0]) + PORCENTAJE_ROBO_BANCO[0]
        const botin = Math.floor(ecoVictima.banco * porcentaje)

        const nuevoBancoVictima = ecoVictima.banco - botin
        const nuevoBolsilloLadron = (ecoLadron.bolsillo || 0) + botin

        // Actualizar datos
        db.setEco(victima.jid, { banco: nuevoBancoVictima })
        db.setEco(sender, { bolsillo: nuevoBolsilloLadron, lastRobBank: ahora })

        const numeroVictima = victima.jid.split('@')[0]

        if (react) await react('💰')
        await reply({
          text: `💥🔓 *¡GOLPE MAESTRO EXITOSO!* 🔓💥\n\n` +
            `¡Lograste hackear la bóveda central y saquear los ahorros de @${numeroVictima}!\n` +
            `💰 Botín obtenido: *+${botin}* WaguriCoins\n` +
            `👜 Tu bolsillo actual: *${nuevoBolsilloLadron}* WaguriCoins`,
          mentions: [victima.jid]
        })
      } else {
        // Falló el atraco
        const multa = randomEntre(MULTA_FALLO[0], MULTA_FALLO[1])
        const multaReal = Math.min(multa, ecoLadron.bolsillo || 0)
        const nuevoBolsilloLadron = Math.max(0, (ecoLadron.bolsillo || 0) - multaReal)

        db.setEco(sender, { bolsillo: nuevoBolsilloLadron, lastRobBank: ahora })

        if (react) await react('🚨')
        await reply({
          text: `🚨 *¡OPERACIÓN FALLIDA EN EL BANCO!* 🚨\n\n` +
            `Activaste las torretas de seguridad y el equipo SWAT te rodeó.\n` +
            `💸 Pagaste una fianza/multa de *${multaReal}* WaguriCoins para no ir a prisión.\n` +
            `👜 Tu bolsillo actual: *${nuevoBolsilloLadron}* WaguriCoins`
        })
      }
    } catch (error) {
      console.error('Error en robbank:', error)
      if (react) await react('❌')
      await reply({ text: `❌ Ocurrió un error en el atraco: ${error.message}` })
    }
  }
}
