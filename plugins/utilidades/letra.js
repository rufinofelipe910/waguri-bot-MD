import axios from 'axios'

export default {
  name: ['lyrics', 'letra'],
  description: 'Busca la letra de una canción',
  category: 'tools',
  ownerOnly: false,

  async run({ sock, from, msg, text, reply, react }) {
    try {
      if (!text) {
        return reply({ text: '🎵 escribe el nombre de la canción, ej: .lyrics Another Love Tom Odell' })
      }

      await react('🎵')

      const res = await axios.get('https://api.alyacore.xyz/tools/lyrics', {
        params: { query: text, key: 'api-uMZCY' },
        timeout: 15000
      })

      const body = res.data
      const song = body?.data?.[0]

      if (!body?.status || !song?.lyrics) {
        await react('❌')
        return reply({ text: `❌ no encontré la letra de *${text}*` })
      }

      const header = `🎼 ${song.title}\n🎤 artista › ${song.artist}\n\n`
      const full = header + song.lyrics

      if (full.length > 4000) {
        const chunks = full.match(/[\s\S]{1,4000}/g)
        for (const chunk of chunks) {
          await reply({ text: chunk })
        }
      } else {
        await reply({ text: full })
      }

      await react('✅')

    } catch (error) {
      await react('❌')
      await reply({ text: `❌ Error: ${error.message}` })
      console.error('Error en lyrics:', error)
    }
  }
}