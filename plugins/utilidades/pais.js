import axios from 'axios'

export default {
  name: ['country', 'pais'],
  description: 'Información detallada de un país',
  category: 'tools',
  ownerOnly: false,

  async run({ sock, from, msg, text, reply, react }) {
    try {
      if (!text) {
        return reply({ text: '🌍 escribe el nombre del país, ej: .country Argentina' })
      }

      await react('🌍')

      const { data } = await axios.get('https://api.alyacore.xyz/tools/country', {
        params: { name: text, key: 'api-uMZCY' },
        timeout: 15000
      })

      if (!data || data.error || !data.name) {
        await react('❌')
        return reply({ text: `❌ no encontré información sobre *${text}*` })
      }

      const currencies = Array.isArray(data.currencies)
        ? data.currencies.map(c => `${c.name} (${c.symbol || 'N/A'})`).join(', ')
        : 'Desconocido'

      const caption =
        `${data.flag} ${data.name} (${data.officialName})\n\n` +
        `🏛️ capital › ${data.capital || 'Desconocida'}\n` +
        `🗺️ región › ${data.region} - ${data.subregion}\n` +
        `👥 población › ${data.population ? data.population.toLocaleString() : 'Desconocida'}\n` +
        `📐 área › ${data.area ? data.area.toLocaleString() + ' km²' : 'Desconocida'}\n` +
        `🗣️ idiomas › ${data.languages || 'Desconocido'}\n` +
        `💰 moneda › ${currencies}\n` +
        `📞 teléfono › ${data.phone || 'N/A'}\n` +
        `🌐 dominio › ${data.tld || 'N/A'}\n` +
        `🚧 fronteras › ${Array.isArray(data.borders) && data.borders.length ? data.borders.join(', ') : 'Ninguna'}\n` +
        `🇺🇳 miembro ONU › ${data.unMember}`

      if (data.flagImage) {
        await sock.sendMessage(
          from,
          { image: { url: data.flagImage }, caption },
          { quoted: msg }
        )
      } else {
        await reply({ text: caption })
      }

      await react('✅')

    } catch (error) {
      await react('❌')
      await reply({ text: `❌ Error: ${error.message}` })
      console.error('Error en country:', error)
    }
  }
}