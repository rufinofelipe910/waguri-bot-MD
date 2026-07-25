import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default {
  name: ['rw', 'waifu'],
  description: 'Trae una waifu aleatoria de la base de datos',
  category: 'gacha',
  ownerOnly: false,

  async run({ sock, from, msg, reply, react }) {
    try {
      await react('🎴')

      const dbPath = path.join(process.cwd(), 'src', 'database', 'characters.json')

      if (!fs.existsSync(dbPath)) {
        await react('❌')
        return reply({ text: '❌ no encontré la base de datos de personajes' })
      }

      const raw = fs.readFileSync(dbPath, 'utf-8')
      const characters = JSON.parse(raw)

      if (!Array.isArray(characters) || characters.length === 0) {
        await react('❌')
        return reply({ text: '❌ la base de datos está vacía' })
      }

      const character = characters[Math.floor(Math.random() * characters.length)]

      if (!character?.img?.length) {
        await react('❌')
        return reply({ text: '❌ este personaje no tiene imágenes disponibles' })
      }

      const image = character.img[Math.floor(Math.random() * character.img.length)]

      const caption =
        `🎴 ${character.name}\n\n` +
        `🆔 id › ${character.id}\n` +
        `⚧️ género › ${character.gender}\n` +
        `📖 origen › ${character.source}\n` +
        `💰 valor › ${character.value}\n` +
        `📌 estado › ${character.status || 'Libre'}\n` +
        `⭐ votos › ${character.votes || 0}`

      await sock.sendMessage(
        from,
        {
          image: { url: image },
          caption
        },
        { quoted: msg }
      )

      await react('✅')

    } catch (error) {
      await react('❌')
      await reply({ text: `❌ Error: ${error.message}` })
      console.error('Error en rw:', error)
    }
  }
}