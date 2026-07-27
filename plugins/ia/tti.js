// plugins/ia/tti.js
import { textToImage } from './creen.js'

export default {
  name: ['tti', 'imagine', 'imagen'],
  description: 'Genera una imagen a partir de un texto (IA)',
  category: 'ia',
  ownerOnly: false,

  async run({ sock, from, msg, text, reply, react }) {
    try {
      if (!text) {
        return reply({ text: '🎨 escribe una descripción, ej: .tti un gato astronauta en la luna' })
      }

      await react('🎨')

      const resultado = await textToImage(text)

      await sock.sendMessage(
        from,
        {
          image: resultado.buffer,
          caption: `🎨 *${resultado.prompt}*`
        },
        { quoted: msg }
      )

      await react('✅')

    } catch (error) {
      await react('❌')
      await reply({ text: `❌ Error: ${error.message}` })
      console.error('Error en tti:', error)
    }
  }
}