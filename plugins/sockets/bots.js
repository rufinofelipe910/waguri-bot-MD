import { db } from '../../database/db.js'

export default {
  name: ['bots', 'listbots'],
  description: 'Muestra todos los bots conectados, incluyendo el Principal y los Subbots',
  category: 'sockets',
  ownerOnly: false,

  async run({ sock, react, reply }) {
    await react('🤖')

    // Obtener el JID del bot actual que ejecuta el comando
    const currentBotJid = sock.user?.id ? sock.user.id.split('@')[0].split(':')[0] + '@s.whatsapp.net' : ''
    const currentBotData = db.getBot(currentBotJid)

    // Obtener todos los subbots en línea de la base de datos
    const subbotsActivos = db.getOnlineBots()

    // Intentar buscar si hay un bot principal guardado en la base de datos global
    const todosLosBots = db.getAllBots ? db.getAllBots() : []
    const mainBotDb = todosLosBots.find(b => b.isMain === true || b.isMain === 1 || b.label?.toUpperCase() === 'MAIN')

    // Lista final donde organizaremos los bots
    let listaCompleta = []

    // 1. Añadir el Bot Principal (Main) siempre primero
    const mainNum = mainBotDb?.jid?.split('@')[0] || currentBotJid.split('@')[0] || 'N/A'
    const mainLabel = mainBotDb?.label || (currentBotData?.label) || 'BOT PRINCIPAL'

    listaCompleta.push({
      label: mainLabel,
      jid: mainNum,
      isMain: true
    })

    // 2. Añadir los subbots activos filtrando por si acaso el JID del principal para no duplicar
    for (const sub of subbotsActivos) {
      const subNum = sub.jid?.split(':')[0] || sub.jid?.split('@')[0] || 'N/A'
      const esDuplicadoMain = sub.jid?.split('@')[0] === currentBotJid.split('@')[0] || sub.isMain === true || sub.isMain === 1 || sub.label?.toUpperCase() === 'MAIN'
      
      if (!esDuplicadoMain) {
        listaCompleta.push({
          label: sub.label || 'Subbot',
          jid: subNum,
          isMain: false
        })
      }
    }

    // Nombre dinámico para el encabezado de la lista basado en el bot actual
    const nombreBotEncabezado = (currentBotData?.label || "MULTIDEVICE BOT").toUpperCase()

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
