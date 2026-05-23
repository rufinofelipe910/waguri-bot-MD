import axios from 'axios'

export default {
  name: ['anime'],
  description: 'Imagen random de anime',
  category: 'misc',
  ownerOnly: false,

  async run({ sock, from, msg, react, reply }) {
    try {
      await react('⏳')

      const res = await axios.get('https://shadow-apis.vercel.app/random/ba', {
        responseType: 'arraybuffer',
        timeout: 10000
      })

      const buffer = Buffer.from(res.data)

      await sock.sendMessage(from, {
        image: buffer,
        caption: '🌸 _Imagen random de anime_',
        mimetype: 'image/jpeg'
      }, { quoted: msg })

      await react('✅')

    } catch (error) {
      await react('❌')
      await reply({ text: `❌ Error: ${error.message}` })
    }
  }
}