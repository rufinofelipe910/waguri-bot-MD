import { db } from '../../database/db.js'

export default {
  name: ['bots', 'listbots'],
  description: 'Muestra la lista de bots conectados diferenciando de forma dinámica el Main de los Subbots',
  category: 'sockets',
  ownerOnly: false,

  async run({ sock, react, reply }) {
    await react('🤖')

    const obtenerNumeroLimpio = (jid) => {
      if (!jid) return null
      return jid.split('@')[0].split(':')[0]
    }

    const todosLosBots = db.getAllBots ? db.getAllBots() : []
    const subbotsActivos = db.getOnlineBots() || []

    // Localizar dinámicamente quién es el Main real
    const mainBotDb = todosLosBots.find(b => b.isMain === true || b.isMain === 1)
    let numeroMainDetectado = null

    if (mainBotDb && mainBotDb.jid) {
      numeroMainDetectado = obtenerNumeroLimpio(mainBotDb.jid)
    } else {
      numeroMainDetectado = global.mainBotNum || obtenerNumeroLimpio(sock.user?.id)
    }

    let listaCompleta = []

    // Forzar el Principal arriba con corona siempre
    if (numeroMainDetectado) {
      const datosMain = db.getBot(`${numeroMainDetectado}@s.whatsapp.net`)
      const labelMain = datosMain?.label && datosMain.label !== 'Subbot' ? datosMain.label : 'MAIN'
      
      listaCompleta.push({
        label: labelMain.toUpperCase(),
        jid: numeroMainDetectado,
        isMain: true
      })
    }

    // Agregar subbots filtrando el número del Main para no duplicar
    for (const sub of subbotsActivos) {
      const subNum = obtenerNumeroLimpio(sub.jid)

      if (!subNum) continue
      if (subNum === numeroMainDetectado) continue

      const esLabelAutomatico = sub.label?.startsWith('SUB_') || sub.label === 'Subbot'
      const nombreSub = esLabelAutomatico ? 'Subbot' : sub.label

      listaCompleta.push({
        label: nombreSub,
        jid: subNum,
        isMain: false
      })
    }

    const miNumeroActual = obtenerNumeroLimpio(sock.user?.id)
    const miJidActual = miNumeroActual ? miNumeroActual + '@s.whatsapp.net' : ''
    const misDatos = db.getBot(miJidActual)
    const nombreBotEncabezado = (misDatos?.label || "MULTIDEVICE BOT").toUpperCase()

    let text = `✨ ═══ 🫧 *${nombreBotEncabezado}* 🫧 ═══ ✨\n`
    text += `🤖 _Bots conectados al sistema_\n\n`

    let i = 1
    for (const bot of listaCompleta) {
      const tipo = bot.isMain ? '👑 *PRINCIPAL*' : '🤖 Subbot'
      
      text += `🟢 *${i}. ${bot.label}*\n`
      text += `   ✦ Tipo: ${tipo}\n`
      text += `   ✦ Número: ${bot.jid}\n\n`
      i++
    }

    text += `🪼 _Powered by DuarteXV_`

    await reply({ text })
    await react('✅')
  }
}
