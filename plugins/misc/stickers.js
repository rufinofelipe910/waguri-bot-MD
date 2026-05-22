import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'
import { promisify } from 'util'
import { downloadMediaMessage } from '@whiskeysockets/baileys'

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tmp = path.join(__dirname, '../../tmp')
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true })

// ─── METADATA POR DEFECTO ────────────────────────────────
const defaultMeta = {
  packname: '⚔️ Yuta Okotsu MD',
  author: 'DuarteXV'
}

// Metadata temporal por usuario (se resetea al reiniciar)
const userMeta = new Map()

export async function addExif(webpBuffer, packname, author) {
  const { default: webp } = await import('node-webpmux')
  const img        = new webp.Image()
  const json       = {
    'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
    'sticker-pack-name': packname || defaultMeta.packname,
    'sticker-pack-publisher': author || defaultMeta.author,
    'emojis': ['⚔️']
  }
  const exifAttr   = Buffer.from([0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,0x00,0x00,0x16,0x00,0x00,0x00])
  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8')
  const exif       = Buffer.concat([exifAttr, jsonBuffer])
  exif.writeUIntLE(jsonBuffer.length, 14, 4)
  await img.load(webpBuffer)
  img.exif = exif
  return await img.save(null)
}

async function convertirWebp(buffer, esVideo = false) {
  const ext    = esVideo ? 'mp4' : 'jpg'
  const inputP = path.join(tmp, `stk_${Date.now()}.${ext}`)
  const outP   = path.join(tmp, `stk_${Date.now()}.webp`)
  fs.writeFileSync(inputP, buffer)
  try {
    if (esVideo) {
      const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputP}"`)
      const dur = parseFloat(stdout.trim())
      if (dur > 15) throw new Error(`El video dura *${dur.toFixed(1)}s*, máximo *15 segundos*`)
      await execAsync(`ffmpeg -i "${inputP}" -t 15 -vf "fps=15,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000" -c:v libwebp -lossless 0 -q:v 70 -loop 0 -an -vsync 0 "${outP}" -y`)
    } else {
      await execAsync(`ffmpeg -i "${inputP}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000" -c:v libwebp "${outP}" -y`)
    }
    return fs.readFileSync(outP)
  } finally {
    try { fs.unlinkSync(inputP) } catch {}
    try { fs.unlinkSync(outP) } catch {}
  }
}

// ─── COMANDO .s ──────────────────────────────────────────
export default [
  {
    name: ['s', 'sticker', 'stik'],
    description: 'Crea stickers — usa .s texto | autor para cambiar marca',
    category: 'misc',
    ownerOnly: false,

    async run({ sock, from, msg, senderNum, args, usedPrefix, react, reply }) {
      try {
        await react('🕒')

        // ─── METADATA ──────────────────────────────────
        const meta = userMeta.get(senderNum) || defaultMeta
        let packname = meta.packname
        let author   = meta.author

        // Si escribió texto: .s Pack | Autor
        if (args.length > 0) {
          const texto = args.join(' ')
          if (texto.includes('|')) {
            const [p, a] = texto.split('|').map(s => s.trim())
            packname = p || packname
            author   = a || author
          } else {
            packname = texto
          }
        }

        const msgType    = Object.keys(msg.message || {})[0]
        const quoted     = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
        const quotedType = quoted ? Object.keys(quoted)[0] : null

        const mediaMsg  = ['imageMessage', 'videoMessage', 'stickerMessage'].includes(msgType) ? msg : null
        const quotedMsg = quoted && ['imageMessage', 'videoMessage', 'stickerMessage'].includes(quotedType)
          ? {
              key: {
                remoteJid: from,
                id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                participant: msg.message.extendedTextMessage?.contextInfo?.participant,
              },
              message: quoted,
            }
          : null

        const targetMsg  = mediaMsg || quotedMsg
        const targetType = mediaMsg ? msgType : quotedType

        if (!targetMsg) return await reply({
          text: `❌ Envía o responde una imagen, video (máx 15s) o sticker.\n\n💡 *${usedPrefix}s* ➔ sticker normal\n💡 *${usedPrefix}s Pack | Autor* ➔ con marca personalizada`
        })

        const buffer    = await downloadMediaMessage(targetMsg, 'buffer', {}, { sock })
        const esVideo   = targetType === 'videoMessage'
        const esSticker = targetType === 'stickerMessage'

        let webpBuffer
        if (esSticker) {
          const inputP = path.join(tmp, `stk_${Date.now()}.webp`)
          const outP   = path.join(tmp, `stk_${Date.now()}_out.webp`)
          fs.writeFileSync(inputP, buffer)
          try {
            await execAsync(`ffmpeg -i "${inputP}" -vcodec copy "${outP}" -y`)
          } catch {
            try {
              await execAsync(`ffmpeg -i "${inputP}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000" -c:v libwebp -lossless 0 -q:v 70 -loop 0 -an -vsync 0 "${outP}" -y`)
            } catch {
              fs.writeFileSync(outP, buffer)
            }
          }
          webpBuffer = fs.readFileSync(outP)
          try { fs.unlinkSync(inputP); fs.unlinkSync(outP) } catch {}
        } else {
          webpBuffer = await convertirWebp(buffer, esVideo)
        }

        const stickerFinal = await addExif(webpBuffer, packname, author)
        await sock.sendMessage(from, { sticker: stickerFinal }, { quoted: msg })
        await react('✅')

      } catch (error) {
        await react('❌')
        await reply({ text: `❌ ${error.message}` })
        console.error('Error en sticker:', error)
      }
    }
  },

  // ─── COMANDO .setmeta ────────────────────────────────
  {
    name: ['setmeta'],
    description: 'Cambia tu marca de agua permanente para stickers',
    category: 'misc',
    ownerOnly: false,

    async run({ senderNum, args, react, reply }) {
      await react('⚙️')
      const texto = args.join(' ')
      if (!texto) return await reply({
        text: `❌ Uso: *.setmeta Pack | Autor*\n\nEjemplo:\n*.setmeta Mi Pack | Mi Nombre*`
      })

      if (texto.includes('|')) {
        const [p, a] = texto.split('|').map(s => s.trim())
        userMeta.set(senderNum, { packname: p || defaultMeta.packname, author: a || defaultMeta.author })
      } else {
        const current = userMeta.get(senderNum) || defaultMeta
        userMeta.set(senderNum, { ...current, packname: texto })
      }

      const meta = userMeta.get(senderNum)
      await reply({
        text: `✅ *Marca de agua actualizada*\n\n📦 *Pack:* ${meta.packname}\n✍️ *Autor:* ${meta.author}`
      })
    }
  },

  // ─── COMANDO .delmeta ────────────────────────────────
  {
    name: ['delmeta'],
    description: 'Resetea tu marca de agua a la del bot',
    category: 'misc',
    ownerOnly: false,

    async run({ senderNum, react, reply }) {
      await react('🗑️')
      userMeta.delete(senderNum)
      await reply({
        text: `✅ *Marca de agua reseteada*\n\n📦 *Pack:* ${defaultMeta.packname}\n✍️ *Autor:* ${defaultMeta.author}`
      })
    }
  }
]