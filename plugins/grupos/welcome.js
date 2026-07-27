import axios from 'axios'
import { db } from '../../database/db.js'

const BACKGROUND_URL = 'https://cdn.dix.lat/me/28cfd2e0-f2fa-485b-a0eb-c9c5e6ea4d89.jpg'

export default {
  name: ['welcome'],
  description: 'Activa o desactiva el mensaje de bienvenida con imagen',
  category: 'grupos',
  groupOnly: true,
  adminOnly: true,

  async run({ from, args, reply }) {
    const opcion = args[0]?.toLowerCase()

    if (opcion !== 'on' && opcion !== 'off') {
      return await reply({ text: '⚠️ Usa: *.welcome on* o *.welcome off*' })
    }

    const activar = opcion === 'on'
    db.setGroup(from, { welcome: activar })

    await reply({
      text: activar
        ? '👋 *Bienvenida activada.* Se enviará una tarjeta a los nuevos miembros.'
        : '🔕 *Bienvenida desactivada.*'
    })
  }
}

export async function sendWelcome(sock, groupId, participants, botLabel) {
  try {
    const groupData = db.getGroup(groupId)
    if (!groupData?.welcome) return

    let groupMeta
    try {
      groupMeta = await sock.groupMetadata(groupId)
    } catch {
      return
    }

    const guildName = groupMeta.subject || 'Grupo'
    const memberCount = groupMeta.participants?.length || participants.length

    let guildIcon
    try {
      guildIcon = await sock.profilePictureUrl(groupId, 'image')
    } catch {
      guildIcon = `https://ui-avatars.com/api/?name=${encodeURIComponent(guildName)}&background=random&size=256`
    }

    for (const jid of participants) {
      const numero = jid.split('@')[0]

      let avatar
      try {
        avatar = await sock.profilePictureUrl(jid, 'image')
      } catch {
        avatar = `https://ui-avatars.com/api/?name=${numero}&background=random&size=256`
      }

      const res = await axios.get('https://api.lempi.lat/api/canvas/welcomev1', {
        params: {
          username: numero,
          guildName,
          guildIcon,
          memberCount,
          avatar,
          background: BACKGROUND_URL,
          quality: 80,
          apikey: 'lem569'
        },
        timeout: 30000,
        responseType: 'arraybuffer'
      })

      await sock.sendMessage(groupId, {
        image: Buffer.from(res.data),
        caption: `👋 ¡Bienvenido/a @${numero} a *${guildName}*!\n\n👥 ahora somos *${memberCount}* miembros`,
        mentions: [jid]
      })
    }
  } catch (error) {
    console.error(`[${botLabel}] Error en sendWelcome:`, error.message)
  }
}