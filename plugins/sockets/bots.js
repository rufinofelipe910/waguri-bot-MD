import { db } from '../../database/db.js'

export default {
  name: ['bots', 'listbots'],
  description: 'Muestra la lista exacta de bots conectados detectando dinámicamente el Main',
  category: 'sockets',
  ownerOnly: false,

  async run({ sock, react, reply }) {
    await react('🤖')

    // Función para limpiar los JIDs de WhatsApp y obtener solo el número limpio
    const obtenerNumeroLimpio = (jid) => {
      if (!jid) return null
      return jid.split('@')[0].split(':')[0]
    }

    // 1. Obtener la lista de todos os bots de la DB para identificar cuál es el Main de verdad
    const todosLosBots = db.getAllBots ? db.getAllBots() : []
    const subbotsActivos = db.getOnlineBots() || []

    // Buscamos dinámicamente el registro que tenga la bandera de ser el Main principal
    const mainBotDb = todosLosBots.find(b => b.isMain === true || b.isMain === 1 || b.label?.toUpperCase() === 'MAIN')

    let listaCompleta = []
    let numeroMainDetectado = null

    // 2. Si encontramos el Main en la DB, lo ponemos de primero de forma dinámica
    if (mainBotDb && mainBotDb.jid) {
      numeroMainDetectado = obtenerNumeroLimpio(mainBotDb.jid)
      listaCompleta.push({
        label: mainBotDb.label && mainBotDb.label.toUpperCase() !== 'MAIN' ? mainBotDb.label : 'MAIN',
        jid: numeroMainDetectado,
        isMain: true
      })
    } else {
      // Si por alguna razón la DB no tiene un "isMain", usamos de respaldo al bot actual para no romper la lista
      numeroMainDetectado = obtenerNumeroLimpio(sock.user?.id)
      const miJid = numeroMainDetectado + '@s.whatsapp.net'
      const miData = db.getBot ? db.getBot(miJid) : null
      
      listaCompleta.push({
        label: miData?.label || 'MAIN',
        jid: numeroMainDetectado,
        isMain: true
      })
    }

    // 3. Agregar los Subbots en línea filtrando el número del Main dinâmico para evitar que se repita
    for (const sub of subbotsActivos) {
      const subNum = obtenerNumeroLimpio(sub.jid)

      if (!subNum) continue
      // Compara contra el número detectado del Main, así nunca se duplica cambies o no de número
      if (subNum === numeroMainDetectado) continue

      // Limpiamos los nombres automáticos tipo SUB_
      const esLabelAutomatico = sub.label?.startsWith('SUB_')
      const nombreSub = esLabelAutomatico ? 'Subbot' : (sub.label || 'Subbot')

      listaCompleta.push({
        label: nombreSub,
        jid: subNum,
        isMain: false
      })
    }

    // Nombre para el encabezado del bot que está ejecutando el comando en este instante
    const miNumeroActual = obtenerNumeroLimpio(sock.user?.id)
    const miJidActual = miNumeroActual ? miNumeroActual + '@s.whatsapp.net' : ''
    const misDatos = db.getBot ? db.getBot(miJidActual) : null
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
