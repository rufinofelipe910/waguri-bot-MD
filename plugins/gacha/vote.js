import fs from 'fs'
import path from 'path'

const dbPath = path.join(process.cwd(), 'src', 'database', 'characters.json')

function readDB() {
  return JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
}

function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))
}

export default {
  name: ['vote'],
  description: 'Vota por un personaje usando su nombre',
  category: 'gacha',
  ownerOnly: false,

  async run({ text, reply, react }) {
    try {
      if (!text) {
        return reply({ text: '❌ escribe el nombre del personaje, ej: .vote Mikasa Ackerman' })
      }

      await react('⭐')

      const characters = readDB()

      const character = characters.find(
        c => c.name.toLowerCase() === text.toLowerCase()
      ) || characters.find(
        c => c.name.toLowerCase().includes(text.toLowerCase())
      )

      if (!character) {
        await react('❌')
        return reply({ text: `❌ no encontré ningún personaje llamado *${text}*` })
      }

      character.votes = (character.votes || 0) + 1
      writeDB(characters)

      await reply({ text: `⭐ votaste por *${character.name}* (${character.votes} votos totales)` })
      await react('✅')

    } catch (error) {
      await react('❌')
      await reply({ text: `❌ Error: ${error.message}` })
      console.error('Error en vote:', error)
    }
  }
}