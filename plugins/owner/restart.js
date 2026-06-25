export default {
  name: ["restart", "reiniciar"],
  description: "Reinicia el bot",
  category: 'owner',
  ownerOnly: true,

  async run({ reply }) {
    try {
      await reply({ text: "♻️ *Reiniciando el bot...* ✨\n\n🔄 ¡Estaré de vuelta en un momento! 💫" })

      setTimeout(() => {
        process.exit(0)
      }, 3000)

    } catch (error) {
      console.log(error)
      await reply({ text: `${error}` })
    }
  }
}