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
  name: ['claim', 'c'],
  description: 'Reclama la waifu del mensaje citado',
  category: 'gacha',
  ownerOnly: false,

  async run({ sock, from, msg, reply, react }) {
    try {
      let rawMessage = msg.message
      if (rawMessage?.ephemeralMessage) {
        rawMessage = rawMessage.ephemeralMessage.message
      }

      const quotedContext = rawMessage?.extendedTextMessage?.contextInfo || rawMessage?.imageMessage?.contextInfo
      const quotedId = quotedContext?.stanzaId

      if (!quotedId) {
        return reply({ text: '❌ responde (cita) al mensaje de la waifu con .claim' })
      }

      const characterId = global.rwCache?.[quotedId]

      if (!characterId) {
        return reply({ text: '❌ ese mensaje no tiene ninguna waifu para reclamar' })
      }

      await react('🎴')

      const characters = readDB()
      const character = characters.find(c => c.id === characterId)

      if (!character) {
        await react('❌')
        return reply({ text: '❌ no encontré ese personaje en la base de datos' })
      }

      if (character.status !== 'Libre') {
        await react('❌')
        return reply({ text: `❌ *${character.name}* ya fue reclamada` })
      }

      const sender = msg.key.participant || msg.key.remoteJid

      character.status = 'Reclamada'
      character.user = sender
      writeDB(characters)

      delete global.rwCache[quotedId]

      await reply({ text: `✅ reclamaste a *${character.name}*` })
      await react('✅')

    } catch (error) {
      await react('❌')
      await reply({ text: `❌ Error: ${error.message}` })
      console.error('Error en claim:', error)
    }
  }
}