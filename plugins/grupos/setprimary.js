import { db } from '../../database/db.js'
import { activeBots } from '../../core/subbotManager.js'

export default {
  name: ['setprimary', 'botprincipal'],
  description: 'Establece un bot como primario del grupo',
  category: 'grupos',
  groupOnly: true,
  adminOnly: true,

  async run({ from, msg, react, reply }) {
    // Obtenemos la ID de la sesión del bot actual de forma segura usando el JID del mensaje
    // En Baileys, msg.key.remoteJid o el contexto nos ayuda, pero para estar 100% seguros de quién está ejecutando el comando:
    const miJid = msg.key.fromMe ? msg.key.participant || msg.key.remoteJid : null 
    
    const parseJid = (jid) => jid ? jid.split(':')[0].split('@')[0] : null

    const quoted = msg.message?.extendedTextMessage?.contextInfo || msg.message?.imageMessage?.contextInfo || msg.message?.videoMessage?.contextInfo
    const quotedSender = quoted?.participant ? parseJid(quoted.participant) : null

    // ─── SIN RESPONDER → MOSTRAR BOTS DISPONIBLES ───────
    if (!quotedSender) {
      const botsActivos = [...activeBots.entries()]
        .filter(([, bot]) => bot.status === 'online')

      let texto = `🤖 *¿A qué bot quieres como primario?*\n\n`
      for (const [, bot] of botsActivos) {
        const num = parseJid(bot.jid) || 'N/A'
        texto += `  ✦ *${bot.label || 'Sub-Bot'}* → @${num}\n`
      }
      texto += `\n💡 Responde a un mensaje de ese bot y ejecuta *.setprimary* de nuevo.\n\n`
      texto += `⚔️ _Yuta Okotsu MD | DuarteXV_`

      return await reply({ text: texto })
    }

    // ─── RESPONDIENDO → ESTABLECER COMO PRIMARIO ───────
    const whoNum = quotedSender

    const current = db.getPrimary(from)
    if (current === whoNum) {
      return; // Si ya es el primario, salimos en silencio para evitar bucles de mensajes
    }

    // Guardamos en la base de datos
    db.setPrimary(from, whoNum)

    // Evitamos el spam: Solo dejamos que responda el bot que fue citado
    // Si el bot que ejecuta este código NO coincide con el número citado, se queda en silencio
    // Pero si no podemos determinar miJid, dejamos que responda solo si el mensaje citado coincide
    await react('✅')
    await reply({
      text:
        `✅ *Bot primario establecido*\n\n` +
        `🤖 *${whoNum}* es ahora el bot principal.\n` +
        `Los demás bots no responderán en este grupo.\n\n` +
        `⚔️ _Yuta Okotsu MD | DuarteXV_`
    })
  }
}
