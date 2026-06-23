import fs from "fs/promises"
import path from "path"
import { tmpdir } from "os"
import ffmpeg from "fluent-ffmpeg"

export default {
  name: ["toimg"],
  category: "utils",
  description: "Convierte un sticker a imagen",

  async run({ sock, msg, from, reply, react }) {
    const quoted =
      msg.message?.extendedTextMessage?.contextInfo?.quotedMessage

    if (!quoted?.stickerMessage) {
      return reply({
        text: "❌ Responde a un sticker con *.toimg*"
      })
    }

    try {
      await react("🖼️")

      const stream = await sock.downloadMediaMessage({
        message: quoted
      })

      const chunks = []

      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      const webpBuffer = Buffer.concat(chunks)

      const input = path.join(
        tmpdir(),
        `sticker_${Date.now()}.webp`
      )

      const output = path.join(
        tmpdir(),
        `image_${Date.now()}.png`
      )

      await fs.writeFile(input, webpBuffer)

      await new Promise((resolve, reject) => {
        ffmpeg(input)
          .toFormat("png")
          .on("end", resolve)
          .on("error", reject)
          .save(output)
      })

      const imageBuffer = await fs.readFile(output)

      await sock.sendMessage(
        from,
        {
          image: imageBuffer,
          caption: "✅ Sticker convertido a imagen"
        },
        { quoted: msg }
      )

      await fs.unlink(input).catch(() => {})
      await fs.unlink(output).catch(() => {})

      await react("✅")

    } catch (e) {
      console.error("[TOIMG]", e)

      await react("❌")

      await reply({
        text: `❌ Error convirtiendo el sticker:\n${e.message}`
      })
    }
  }
}