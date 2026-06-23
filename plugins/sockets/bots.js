import { db } from '../../database/db.js'
import config from '../../config.js'
import fs from 'fs'
import path from 'path'

export default {
  name: ['bots', 'listbots'],
  description: 'Muestra los bots con el tiempo exacto que llevan conectados.',
  category: 'sockets',
  ownerOnly: false,

  async run({ sock, react, reply, mainBotNum, activeBotsLive }) {
    await react('🤖')

    const obtenerNumeroLimpio = (jid) => {
      if (!jid) return null
      return jid.split('@')[0].split(':')[0].replace(/\D/g, '')
    }

    const esLabelAutomatico = (label) =>
      label?.startsWith('SUB_') || label === 'Subbot' || label === 'MAIN' || !label

    const calcularTiempoActivo = (uptimeTimestamp) => {
      if (!uptimeTimestamp) return 'Conectado'
      const ahora = Date.now()
      const diferencia = ahora - new Date(uptimeTimestamp).getTime()
      if (diferencia < 0) return 'Recién conectado'

      const minutos = Math.floor((diferencia / (1000 * 60)) % 60)
      const horas = Math.floor((diferencia / (1000 * 60 * 60)) % 24)
      const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24))

      let tiempoStr = ''
      if (dias > 0) tiempoStr += `${dias}d `
      if (horas > 0 || dias > 0) tiempoStr += `${horas}h `
      tiempoStr += `${minutos}m`
      return tiempoStr || '1m'
    }

    const todosLosBots = db.getAllBots ? db.getAllBots() : []
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

    // 1. Bot Principal
    if (numeroMainReal) {
      const datosMain = db.getBot(`${numeroMainReal}@s.whatsapp.net`) || db.getBot('main')
      const nombreMain = esLabelAutomatico(datosMain?.label) ? config.botName : datosMain.label
      
      if (!global.botStartTime) global.botStartTime = Date.now()
      const uptimeMain = calcularTiempoActivo(global.botStartTime)

      listaFiltrada.push({
        label: nombreMain,
        jid: numeroMainReal,
        isMain: true,
        uptime: uptimeMain
      })
      numerosVistos.add(numeroMainReal)
    }

    // Convertir el snapshot live en un Map para búsquedas rápidas por número
    const liveSnapshot = Array.isArray(activeBotsLive) ? activeBotsLive : []
    const liveMap = new Map()
    for (const b of liveSnapshot) {
      const num = obtenerNumeroLimpio(b.jid)
      if (num) liveMap.set(num, b)
    }

    // 2. Escaneo de carpetas físicas
    const SUBBOTS_DIR = './sessions/subbots'
    if (fs.existsSync(SUBBOTS_DIR)) {
      const carpetasSesion = fs.readdirSync(SUBBOTS_DIR, { withFileTypes: true })
        .filter(dir => dir.isDirectory())
        .map(dir => dir.name)

      for (const idCarpeta of carpetasSesion) {
        const subNum = idCarpeta.replace('sub_', '')
        
        if (!subNum || subNum === numeroMainReal) continue
        if (numerosVistos.has(subNum)) continue

        let datosDb = db.getBot(`${subNum}@s.whatsapp.net`) || db.getBot(idCarpeta)
        if (!datosDb) {
          datosDb = todosLosBots.find(b => b.jid && obtenerNumeroLimpio(b.jid) === subNum)
        }

        const labelCandidato = (datosDb?.label && !esLabelAutomatico(datosDb.label))
          ? datosDb.label
          : idCarpeta.toUpperCase()

        // 🔍 AQUÍ CAMBIA LA PRIORIDAD:
        // Primero buscamos el 'connectedAt' que el Manager tiene en memoria viva (Snapshot)
        const botEnVivo = liveMap.get(subNum)
        let uptimeRaw = botEnVivo?.connectedAt || datosDb?.connectedAt || null
        
        // Si no hay registro en memoria (ej. tras un reinicio general), usamos el disco como plan B
        if (!uptimeRaw) {
          try {
            const credsFile = path.join(SUBBOTS_DIR, idCarpeta, 'creds.json')
            if (fs.existsSync(credsFile)) {
              uptimeRaw = fs.statSync(credsFile).birthtimeMs // Fecha de creación del archivo de conexión actual
            }
          } catch (_) {}
        }

        numerosVistos.add(subNum)

        listaFiltrada.push({
          label: labelCandidato,
          jid: subNum,
          isMain: false,
          uptime: calcularTiempoActivo(uptimeRaw)
        })
      }
    }

    // 3. Renderizar Mensaje
    const nombreBotEncabezado = listaFiltrada[0]?.label || config.botName

    let text = `✨ ═══ 🫧 *${nombreBotEncabezado.toUpperCase()}* 🫧 ═══ ✨\n`
    text += `🤖 _Lista de conexiones y tiempo de actividad real_\n\n`

    let i = 1
    for (const bot of listaFiltrada) {
      const tipo = bot.isMain ? '👑 *PRINCIPAL*' : '🤖 Subbot'
      text += `🟢 *${i}. ${bot.label}*\n`
      text += `   ✦ Tipo: ${tipo}\n`
      text += `   ✦ Número: +${bot.jid}\n`
      text += `   ✦ Conectado hace: \`${bot.uptime}\`\n\n`
      i++
    }

    text += `🪼 _Powered by DuarteXV_`

    await reply({ text })
    await react('✅')
  }
}
