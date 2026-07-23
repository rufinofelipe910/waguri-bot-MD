import config from '../../config.js'

export default {
  name: ['owner', 'dueño'],
  description: 'Muestra la información del dueño del bot',
  category: 'info',
  ownerOnly: false,

  async run({ sock, from, msg }) {
    const ownerNum = config.ownerNumber?.[0]

    if (!ownerNum) return

    await sock.sendMessage(from, {
      contacts: {
        displayName: '𝓡𝓮𝔂 𝓡𝓾𝓯𝓲𝓷𝓸 👑',
        contacts: [{
          vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:𝓡𝓮𝔂 𝓡𝓾𝓯𝓲𝓷𝓸 👑\nTEL;type=CELL;type=VOICE;waid=${ownerNum}:+${ownerNum}\nEND:VCARD`
        }]
      }
    }, { quoted: msg })
  }
}