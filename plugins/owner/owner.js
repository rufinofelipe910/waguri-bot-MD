import config from '../../config.js'

export default {
  name: ['owner', 'dueño'],
  description: 'Muestra la información del dueño del bot',
  category: 'info',
  ownerOnly: false,

  async run({ sock, from, msg, reply }) {
    const ownerNum = config.ownerNumber?.[0]

    if (!ownerNum) {
      return await reply({ text: '❌ No hay owner configurado.' })
    }

    const ownerJid = `${ownerNum}@s.whatsapp.net`

    await sock.sendMessage(from, {
      contacts: {
        displayName: config.botName || 'Owner',
        contacts: [{
          vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${config.botName || 'Owner'}\nTEL;type=CELL;type=VOICE;waid=${ownerNum}:+${ownerNum}\nEND:VCARD`
        }]
      }
    }, { quoted: msg })
  }
}