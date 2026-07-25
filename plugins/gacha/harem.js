import fs from 'fs'
import path from 'path'

const dbPath = path.join(process.cwd(), 'src', 'database', 'characters.json')

function readDB() {
  return JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
}

export default {
  name: ['harem'],
  description: 'Muestra tu colección de waifus reclamadas',
  category: 'gacha',
  ownerOnly: false,

  async run({ from, msg, reply, react }) {
    try {
      await react('📋')

      const sender = msg.key.participant || msg.key.remoteJid
      const characters = readDB()

      const mias = characters.filter(c => c.user === sender)

      if (!mias.length) {
        await react('❌')
        return reply({ text: '❌ no tienes ninguna waifu reclamada aún, usa .rw para conseguir una' })
      }

      const valorTotal = mias.reduce((acc, c) => acc + Number(c.value || 0), 0)

      let texto = `📋 *TU HAREM* (${mias.length})\n\n`

      mias.forEach((c, i) => {
        texto += `${i + 1}. *${c.name}*\n` +
                 `   🆔 ${c.id} · 📖 ${c.source} · 💰 ${c.value}\n\n`
      })

      texto += `💰 valor total › ${valorTotal.toLocaleString()}`

      await reply({ text: texto })
      await react('✅')

    } catch (error) {
      await react('❌')
      await reply({ text: `❌ Error: ${error.message}` })
      console.error('Error en harem:', error)
    }
  }
}