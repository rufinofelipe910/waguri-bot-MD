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

      const res = await axios.get('https://api.lempi.lat/ai/freegen', {
        params: {
          prompt: text,
          ratio: '1:1',
          apikey: 'lem569'
        },
        timeout: 90000
      })

      const body = res.data

      // 🔍 DEBUG TEMPORAL
      console.log('[TTI DEBUG] respuesta completa:', JSON.stringify(body, null, 2))

      const imageUrl = body?.result || body?.data?.url || body?.url

      if (!body?.status || !imageUrl) {
        await react('❌')
        return reply({ text: '❌ no pude generar la imagen, revisa consola para debug' })
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