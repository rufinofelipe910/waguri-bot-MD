import { db } from '../../database/db.js'

export default {
  name: ['bots', 'listbots'],
  description: 'Muestra la lista de bots conectados filtrando duplicados de la base de datos',
  category: 'sockets',
  ownerOnly: false,

  async run({ sock, react, reply }) {
    await react('🤖')

    // Función auxiliar para obtener solo los dígitos del número telefónico
    const obtenerNumeroLimpio = (jid) => {
      if (!jid) return null
      return jid.split('@')[0].split(':')[0].replace(/\D/g, '')
    }

    // 1. Obtener los datos desde tu DB SQLite
    const subbotsActivos = db.getOnlineBots() || []
    const todosLosBots = db.getAllBots ? db.getAllBots() : []

    // 2. Localizar al verdadero bot principal usando los registros de la DB
    // Buscamos el registro que tenga la propiedad isMain o la llave id/label como "MAIN"
    const registroMain = todosLosBots.find(b => b.isMain === true || b.isMain === 1 || b.label === 'MAIN' || b.id === 'main')
    
    let numeroMainReal = null
    if (registroMain && registroMain.jid) {
      numeroMainReal = obtenerNumeroLimpio(registroMain.jid)
    } else {
      // Respaldo secundario si la DB usa la variable global de tu consola
      numeroMainReal = global.mainBotNum || obtenerNumeroLimpio(sock.user?.id)
    }

    let listaFiltrada = []
    const numerosVistos = new Set() // Estructura clave para eliminar duplicados

    // 3. Insertar al Bot Principal detectado en la primera posición
    if (numeroMainReal) {
      const datosMain = db.getBot(`${numeroMainReal}@s.whatsapp.net`) || db.getBot('main')
      const labelMain = datosMain?.label && !datosMain.label.startsWith('SUB_') ? datosMain.label : 'MAIN'
      
      listaFiltrada.push({
        label: labelMain.toUpperCase(),
        jid: numeroMainReal,
        isMain: true
      })
      numerosVistos.add(numeroMainReal) // Bloqueamos este número para que no se repita abajo
    }

    // 4. Mapear los subbots activos evitando repetidos
    for (const sub of subbotsActivos) {
      const subNum = obtenerNumeroLimpio(sub.jid)
      if (!subNum) continue

      // Si el número ya está en el Set (ya se agregó o es el Main), lo salta
      if (numerosVistos.has(subNum)) continue

      numerosVistos.add(subNum)

      // Limpiar etiquetas autogeneradas molestas
      const esLabelAutomatico = sub.label?.startsWith('SUB_') || sub.label === 'Subbot'
      const nombreSub = esLabelAutomatico ? 'Subbot' : sub.label

      listaFiltrada.push({
        label: nombreSub,
        jid: subNum,
        isMain: false
      })
    }

    // Identificar el nombre del bot que está respondiendo el mensaje actual
    const miNumeroActual = obtenerNumeroLimpio(sock.user?.id)
    const miJidActual = miNumeroActual ? miNumeroActual + '@s.whatsapp.net' : ''
    const misDatos = db.getBot(miJidActual)
    const nombreBotEncabezado = (misDatos?.label || "MULTIDEVICE BOT").toUpperCase()

    // 5. Armado del diseño final del mensaje
    let text = `✨ ═══ 🫧 *${nombreBotEncabezado}* 🫧 ═══ ✨\n`
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
