import { db } from '../../database/db.js'
import config from '../../config.js'
import fs from 'fs'
import path from 'path'

export default {
  name: ['bots', 'listbots'],
  description: 'Muestra todos los bots del almacenamiento cruzando nombres personalizados de la base de datos.',
  category: 'sockets',
  ownerOnly: false,

  async run({ sock, react, reply, mainBotNum }) {
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

    // 1. Añadir forzosamente al Bot Principal en la posición #1
    if (numeroMainReal) {
      const datosMain = db.getBot(`${numeroMainReal}@s.whatsapp.net`) || db.getBot('main')
      const nombreMain = esLabelAutomatico(datosMain?.label) ? config.botName : datosMain.label
      const uptimeMain = global.botStartTime ? calcularTiempoActivo(global.botStartTime) : 'Activo'

      listaFiltrada.push({
        label: nombreMain,
        jid: numeroMainReal,
        isMain: true,
        uptime: uptimeMain
      })
      numerosVistos.add(numeroMainReal)
    }

    // 2. ESCANEO COMPLETO DE CARPETAS (Basado en la estructura de la imagen 1001072750.png)
    const SUBBOTS_DIR = './sessions/subbots'
    if (fs.existsSync(SUBBOTS_DIR)) {
      const carpetasSesion = fs.readdirSync(SUBBOTS_DIR, { withFileTypes: true })
        .filter(dir => dir.isDirectory())
        .map(dir => dir.name)

      for (const idCarpeta of carpetasSesion) {
        const subNum = idCarpeta.replace('sub_', '')
        
        if (!subNum || subNum === numeroMainReal) continue
        if (numerosVistos.has(subNum)) continue

        // 🔍 BÚSQUEDA ROBUSTA EN BASE DE DATOS: 
        // Intentamos por JID completo, por ID de carpeta, o buscando el número limpio en la lista completa
        let datosDb = db.getBot(`${subNum}@s.whatsapp.net`) || db.getBot(idCarpeta)
        if (!datosDb) {
          datosDb = todosLosBots.find(b => b.jid && obtenerNumeroLimpio(b.jid) === subNum)
        }

        // Recuperar el nombre editado si existe
        const labelCandidato = (datosDb?.label && !esLabelAutomatico(datosDb.label))
          ? datosDb.label
          : idCarpeta.toUpperCase()

        // Determinar el tiempo de actividad usando los archivos internos de la sesión
        const folderPath = path.join(SUBBOTS_DIR, idCarpeta)
        let uptimeRaw = datosDb?.connectedAt || null
        
        if (!uptimeRaw) {
          try {
            // Revisamos la estampa de tiempo del archivo de credenciales para más precisión si no está en DB
            const credsFile = path.join(folderPath, 'creds.json')
            const authDbFile = path.join(folderPath, 'auth.db')
            
            if (fs.existsSync(credsFile)) {
              uptimeRaw = fs.statSync(credsFile).mtimeMs
            } else if (fs.existsSync(authDbFile)) {
              uptimeRaw = fs.statSync(authDbFile).mtimeMs
            } else {
              uptimeRaw = fs.statSync(folderPath).mtimeMs
            }
          } catch (_) {
            uptimeRaw = null
          }
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

    // 3. Renderizado del mensaje final
    const nombreBotEncabezado = listaFiltrada[0]?.label || config.botName

    let text = `✨ ═══ 🫧 *${nombreBotEncabezado.toUpperCase()}* 🫧 ═══ ✨\n`
    text += `🤖 _Lista de conexiones y tiempo de actividad_\n\n`

    let i = 1
    for (const bot of listaFiltrada) {
      const tipo = bot.isMain ? '👑 *PRINCIPAL*' : '🤖 Subbot'
      text += `🟢 *${i}. ${bot.label}*\n`
      text += `   ✦ Tipo: ${tipo}\n`
      text += `   ✦ Número: +${bot.jid}\n`
      text += `   ✦ Activo hace: \`${bot.uptime}\`\n\n`
      i++
    }

    text += `🪼 _Powered by DuarteXV_`

    await reply({ text })
    await react('✅')
  }
}
