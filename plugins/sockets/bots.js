import { db } from '../../database/db.js'

export default {
  name: ['bots', 'listbots'],
  description: 'Muestra la lista de bots conectados filtrando duplicados de la base de datos',
  category: 'sockets',
  ownerOnly: false,

  async run({ sock, react, reply, mainBotNum }) {
    await react('🤖')

    // Limpia el JID eliminando carácteres o sub-ids de Baileys
    const obtenerNumeroLimpio = (jid) => {
      if (!jid) return null
      return jid.split('@')[0].split(':')[0].replace(/\D/g, '')
    }

    const subbotsActivos = db.getOnlineBots() || []
    const todosLosBots = db.getAllBots ? db.getAllBots() : []

    // 1. Determinar el número del verdadero Bot Principal
    // Prioridad:
    //   a) mainBotNum recibido por ctx -> funciona tanto en MAIN como en subbots,
    //      porque viaja desde subbotManager -> workerData -> handleMessage -> ctx
    //   b) global.mainBotNum -> fallback si corre directo en el proceso principal
    //   c) DB -> último fallback, por si lo anterior no estuviera disponible
    let numeroMainReal = null

    if (mainBotNum) {
      numeroMainReal = mainBotNum
    } else if (global.mainBotNum) {
      numeroMainReal = global.mainBotNum
    } else {
      const registroMain = todosLosBots.find(b => b.isMain === true || b.isMain === 1)
      numeroMainReal = registroMain ? obtenerNumeroLimpio(registroMain.jid) : obtenerNumeroLimpio(sock.user?.id)
    }

    let listaFiltrada = []
    const numerosVistos = new Set()

    // 2. Insertar SIEMPRE al Bot Principal real en el puesto #1 con su corona
    if (numeroMainReal) {
      const datosMain = db.getBot(`${numeroMainReal}@s.whatsapp.net`) || db.getBot('main')
      let labelMain = datosMain?.label || 'MAIN'

      if (labelMain.startsWith('SUB_') || labelMain === 'Subbot') {
        labelMain = 'MAIN'
      }

      listaFiltrada.push({
        label: labelMain.toUpperCase(),
        jid: numeroMainReal,
        isMain: true
      })

      numerosVistos.add(numeroMainReal) // Bloquea este número para que ningún subbot lo repita abajo
    }

    // 3. Agregar el resto de subbots en línea, eliminando duplicados mediante el Set
    for (const sub of subbotsActivos) {
      const subNum = obtenerNumeroLimpio(sub.jid)
      if (!subNum) continue

      // Si el número ya fue procesado o coincide con el Main real, se ignora por completo
      if (numerosVistos.has(subNum) || subNum === numeroMainReal) continue
      numerosVistos.add(subNum)

      const esLabelAutomatico = sub.label?.startsWith('SUB_') || sub.label === 'Subbot' || sub.label === 'MAIN'
      const nombreSub = esLabelAutomatico ? 'Subbot' : sub.label

      listaFiltrada.push({
        label: nombreSub,
        jid: subNum,
        isMain: false
      })
    }

    // Obtener el nombre del bot actual que está respondiendo en el chat
    const miNumeroActual = obtenerNumeroLimpio(sock.user?.id)
    const miJidActual = miNumeroActual ? miNumeroActual + '@s.whatsapp.net' : ''
    const misDatos = db.getBot(miJidActual)

    // Si soy un subbot, mi encabezado debe reflejar mi identidad limpia
    let nombreBotEncabezado = misDatos?.label || "SUBBOT"
    if (miNumeroActual === numeroMainReal) {
      nombreBotEncabezado = (misDatos?.label && misDatos.label !== 'Subbot' ? misDatos.label : "MAIN").toUpperCase()
    }

    // 4. Construcción del mensaje estético final
    let text = `✨ ═══ 🫧 *${nombreBotEncabezado.toUpperCase()}* 🫧 ═══ ✨\n`
    text += `🤖 _Bots conectados al sistema_\n\n`

    let i = 1
    for (const bot of listaFiltrada) {
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