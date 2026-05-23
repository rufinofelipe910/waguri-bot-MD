import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'
import { promisify } from 'util'
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { db } from '../../database/db.js'
import config from '../../config.js'

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tmp = path.join(__dirname, '../../tmp')
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true })

async function addExif(webpBuffer, packname, author) {
  const { default: webp } = await import('node-webpmux')
  const tmpExif = path.join(tmp, `exif_${Date.now()}.webp`)
  try {
    const img        = new webp.Image()
    const json       = {
      'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
      'sticker-pack-name': packname,
      'sticker-pack-publisher': author,
      'emojis': ['⚔️']
    }
    const exifAttr   = Buffer.from([0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,0x00,0x00,0x16,0x00,0x00,0x00])
    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8')
    const exif       = Buffer.concat([exifAttr, jsonBuffer])
    exif.writeUIntLE(jsonBuffer.length, 14, 4)
    fs.writeFileSync(tmpExif, webpBuffer)
    await img.load(tmpExif)
    img.exif = exif
    await img.save(tmpExif)
    const result = fs.readFileSync(tmpExif)
    return { buffer: result, packname, author, sizeBefore: webpBuffer.length, sizeAfter: result.length }
  } finally {
    try { fs.unlinkSync(tmpExif) } catch {}
  }
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

export default {
  name: ['s', 'sticker', 'stik'],
  description: 'Crea stickers desde imagen, video o sticker',
  category: 'misc',
  ownerOnly: false,

  async run({ sock, from, msg, senderNum, args, usedPrefix, react, reply }) {
    try {
      await react('🕒')

      // ─── DEBUG TEMPORAL ──────────────────────────────────
      await reply({ text: `config.packname: "${config.packname}"\nconfig.wm: "${config.wm}"` })
      return

    } catch (error) {
      await react('❌')
      await reply({ text: `❌ ${error.message}` })
      console.error('Error en sticker:', error)
    }
  }
}