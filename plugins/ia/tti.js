import axios from 'axios'

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

      const res = await axios.get('https://api.lempi.lat/ai/zimg', {
        params: {
          prompt: text,
          size: '1024x1024',
          apikey: 'lem569'
        },
        timeout: 60000
      })

      const body = res.data
      const imageUrl = body?.resultado?.url

      if (!body?.status || !imageUrl) {
        await react('❌')
        return reply({ text: '❌ no pude generar la imagen, intenta de nuevo' })
      }

      await sock.sendMessage(
        from,
        {
          image: { url: imageUrl },
          caption: `🎨 *${text}*`
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