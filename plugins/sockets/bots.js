import { db } from '../../database/db.js'

export default {
  name: ['bots', 'listbots'],
  description: 'Muestra la lista de bots conectados diferenciando el bot del servidor base',
  category: 'sockets',
  ownerOnly: false,

  async run({ sock, react, reply }) {
    await react('🤖')

    // Función para limpiar los JIDs de WhatsApp y obtener solo el número limpio
    const obtenerNumeroLimpio = (jid) => {
      if (!jid) return null
      return jid.split('@')[0].split(':')[0]
    }

    // 1. Obtener todos los bots registrados y los que están online desde tu DB
    const todosLosBots = db.getAllBots ? db.getAllBots() : []
    const subbotsActivos = db.getOnlineBots() || []

    // 2. Encontrar cuál es el Bot Principal real en la base de datos
    // Buscamos el registro que tenga explícitamente isMain === true
    let mainBotDb = todosLosBots.find(b => b.isMain === true || b.isMain === 1)

    // Si no hay ninguno marcado como Main en la DB, asumimos el bot actual del proceso raíz
    const miNumeroActual = obtenerNumeroLimpio(sock.user?.id)

    let listaCompleta = []
    let numeroMainDetectado = null

    if (mainBotDb && mainBotDb.jid) {
      numeroMainDetectado = obtenerNumeroLimpio(mainBotDb.jid)
    } else {
      // Si no hay bandera, el proceso actual se toma como referencia de Main principal
      numeroMainDetectado = miNumeroActual
    }

    // Insertar el Bot Principal siempre al inicio de la lista
    const datosMain = db.getBot(`${numeroMainDetectado}@s.whatsapp.net`)
    listaCompleta.push({
      label: datosMain?.label && datosMain.label !== 'Subbot' ? datosMain.label : 'MAIN',
      jid: numeroMainDetectado,
      isMain: true
    })

    // 3. Agregar los Subbots activos filtrando el número del Main para que no se repita
    for (const sub of subbotsActivos) {
      const subNum = obtenerNumeroLimpio(sub.jid)

      if (!subNum) continue
      // Evita duplicar el bot principal en la lista de subbots
      if (subNum === numeroMainDetectado) continue

      // Limpiar etiquetas automáticas
      const esLabelAutomatico = sub.label?.startsWith('SUB_') || sub.label === 'Subbot'
      const nombreSub = esLabelAutomatico ? 'Subbot' : sub.label

      listaCompleta.push({
        label: nombreSub,
        jid: subNum,
        isMain: false
      })
    }

    // Nombre para el encabezado del bot que está respondiendo la solicitud
    const miJidActual = miNumeroActual ? miNumeroActual + '@s.whatsapp.net' : ''
    const misDatos = db.getBot(miJidActual)
    const nombreBotEncabezado = (misDatos?.label || "MULTIDEVICE BOT").toUpperCase()

    let text = `✨ ═══ 🫧 *${nombreBotEncabezado}* ═══ ✨\n`
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
