import axios from 'axios'

export default {
  name: ['claude'],
  description: 'Habla con Claude (IA)',
  category: 'ia',
  ownerOnly: false,

  async run({ sock, from, msg, text, reply, react }) {
    try {
      if (!text) {
        return reply({ text: '💬 escribe algo para hablar con Claude, ej: .claude hola' })
      }

      await react('💭')

      const res = await axios.get('https://api.lempi.lat/ai/claude', {
        params: {
          text,
          apikey: 'lem569'
        },
        timeout: 30000
      })

      const data = res.data

      if (!data?.status || !data?.resultado) {
        await react('❌')
        return reply({ text: '❌ no pude procesar tu mensaje, intenta de nuevo' })
      }

      const modelo = data.modelo ? `\n\n_modelo: ${data.modelo}_` : ''

      await reply({ text: `${data.resultado}${modelo}` })
      await react('✅')

    } catch (error) {
      await react('❌')
      await reply({ text: `❌ Error: ${error.message}` })
      console.error('Error en claude:', error)
    }
  }
}