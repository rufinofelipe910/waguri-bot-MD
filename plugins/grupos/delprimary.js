import { db } from '../../database/db.js'

export default {
  name: ['delprimary', 'quitarprincipal'],
  description: 'Quita el bot primario del grupo',
  category: 'grupos',
  groupOnly: true,
  adminOnly: true,

  async run({ from, msg, react, reply, conn }) {
    // 1. Obtener de forma ultra segura el número del bot actual usando la conexión nativa de Baileys
    const miJid = conn?.user?.id || conn?.user?.jid || ''
    const parseNum = (jid) => jid ? jid.split(':')[0].split('@')[0] : null
    const miNumero = parseNum(miJid)

    // 2. Obtener el bot primario actual de la DB
    const primary = db.getPrimary(from)

    // ─── CASO 1: NO HAY BOT PRIMARIO ASIGNADO ───────────
    if (!primary) {
      // Si no hay primario y quieres evitar que respondan todos, podemos hacer que solo
      // responda el bot si coincide con el jid principal de tu config (pero como está baneado,
      // para evitar que se duplique el aviso, puedes dejarlo pasar o que solo responda uno solo usando un delay aleatorio)
      return await reply({
        text:
          `⚠️ *Este grupo no tiene bot primario establecido.*\n\n` +
          `💡 Usa *.setprimary* para establecer uno.\n\n` +
          `⚔️ _Yuta Okotsu MD | DuarteXV_`
      })
    }

    // ─── CASO 2: SÍ HAY BOT PRIMARIO CONFIGURADO ─────────
    // Filtro maestro: Si logramos obtener el número del bot y NO es el primario de la DB,
    // se frena aquí. El bot que no corresponde se queda completamente mudo.
    if (miNumero && primary !== miNumero) {
      return
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
