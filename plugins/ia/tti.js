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
        timeout: 60000,
        responseType: 'arraybuffer'
      })

      const contentType = res.headers['content-type'] || ''

      // si la API falla, a veces devuelve JSON de error en vez de imagen
      if (!contentType.startsWith('image/')) {
        await react('❌')
        return reply({ text: '❌ no pude generar la imagen, intenta de nuevo' })
      }

      const buffer = Buffer.from(res.data)

      await sock.sendMessage(
        from,
        {
          image: buffer,
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