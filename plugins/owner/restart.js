import { spawn } from "child_process";
import path from "path";

export default {
  name: ["restart", "reiniciar"],
  description: "Reinicia el bot",
  category: 'owner',
  ownerOnly: true,

  async run({ reply }) {
    try {
      await reply({ text: "♻️ *Reiniciando el bot...* ✨\n\n🔄 ¡Estaré de vuelta en un momento! 💫" })

      setTimeout(() => {
        const scriptPath = path.resolve(process.cwd(), "index.js")

        const child = spawn(process.execPath, [scriptPath], {
          detached: true,
          stdio: "inherit",
          cwd: process.cwd(),
        })

        child.unref()

        process.exit(0)
      }, 1500)

    } catch (error) {
      console.log(error)
      await reply({ text: `${error}` })
    }
  }
}