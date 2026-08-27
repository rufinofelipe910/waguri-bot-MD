import axios from 'axios'

const API_KEY = 'lem_316fcbcd534c8fb6ffec8fafa112dbd0685a4370'

export default {
  name: ['claude'],
  description: 'Habla con Claude (IA)',
  category: 'ia',
  ownerOnly: false,

  async run({ text, reply, react }) {
    try {
      if (!text) {
        return reply({ text: '💬 escribe algo, ej: .claude hola' })
      }

      await react('💭')

      const res = await axios.get('https://api.lempi.lat/ai/claude', {
        params: {
          q: text,
          model: 'sonnet-5',
          thinking: 'low',
          apikey: API_KEY
        },
        timeout: 30000
      })

      const body = res.data

      if (!body?.status || !body?.resultado) {
        await react('❌')
        return reply({ text: '❌ no pude procesar tu mensaje, intenta de nuevo' })
      }

      await reply({ text: body.resultado })
      await react('✅')

    } catch (error) {
      await react('❌')
      await reply({ text: `❌ Error: ${error.message}` })
      console.error('Error en claude:', error)
    }
  }
}