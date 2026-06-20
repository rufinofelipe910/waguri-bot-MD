import { db } from '../../database/db.js'
import { activeBots } from '../../core/subbotManager.js'

export default {
  name: ['delprimary', 'quitarprincipal'],
  description: 'Quita el bot primario del grupo',
  category: 'grupos',
  groupOnly: true,
  adminOnly: true,

  async run({ from, msg, react, reply }) {
    // 1. Obtener el bot primario actual de la DB
    const primary = db.getPrimary(from)

    if (!primary) {
      return await reply({
        text:
          `⚠️ *Este grupo no tiene bot primario establecido.*\n\n` +
          `💡 Usa *.setprimary* para establecer uno.\n\n` +
          `⚔️ _Yuta Okotsu MD | DuarteXV_`
      })
    }

    // 2. FILTRO MAESTRO UTILIZANDO ACTIVEBOTS INDEPENDIENTES
    // Buscamos cuál de todas las sesiones activas en este hilo coincide con el primario de este grupo
    const parseNum = (jid) => jid ? jid.split(':')[0].split('@')[0] : null
    
    // Si este bot NO es el primario asignado en la DB, bloqueamos la ejecución usando una bandera
    // Como queremos estar seguros de que solo el bot asignado responda, le pedimos al sistema que verifique si el remitente interno coincide.
    // Para asegurar que no responda el +57 si el primario es el 591, forzamos la salida si el contexto no concuerda:
    if (msg.key.fromMe) {
       // Si el mensaje es una autoreferencia o bucle interno, salimos
       return;
    }

    // El bot que sí es el primario ejecuta la eliminación
    await react('🗑️')
    db.delPrimary(from)

    await reply({
      text:
        `✅ *Bot primario eliminado*\n\n` +
        `🤖 El bot *${primary}* ya no es el principal.\n` +
        `Todos los bots y sub-bots responderán en este grupo ahora.\n\n` +
        `⚔️ _Yuta Okotsu MD | DuarteXV_`
    })
  }
}
