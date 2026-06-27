export default {
  name: ['reactcanal'],
  description: 'Hace que todos los bots reaccionen a un mensaje de canal',
  category: 'utils',
  ownerOnly: false,

  async run({ sock, args, reply }) {
    const link = args[0]
    const emoji = args[1]

    if (!link || !emoji) {
      return await reply({ text: '⚠️ Usa: *.reactcanal <link del mensaje> <emoji>*' })
    }

    const match = link.match(/channel\/([A-Za-z0-9]+)\/(\d+)/)
    if (!match) {
      return await reply({ text: '❌ Ese no es un link válido de mensaje de canal.' })
    }

    const invite = match[1]
    const serverId = match[2]

    try {
      // El propio bot que recibe el comando reacciona directo
      await sock.newsletterReactMessage(invite, serverId, emoji)
    } catch (e) {
      // si falla con invite, seguimos igual con el broadcast a los demás
    }

    // Le avisamos al manager (solo existe si este bot es el Main)
    try {
      const { broadcastReaccionCanal } = await import('../../core/subbotManager.js')
      broadcastReaccionCanal({ invite, serverId, emoji })
    } catch {
      // si este bot es un subbot, no tiene el manager real -> lo ignoramos
    }

    await reply({ text: `✅ Todos los bots están reaccionando con ${emoji}` })
  }
}