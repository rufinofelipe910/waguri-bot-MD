export default {
  name: ["spoiler"],
  description: "Envía un mensaje con efecto spoiler (oculto tras 'Leer más')",
  category: "utils",
  ownerOnly: false,

  async run({ reply, text }) {
    if (!text) {
      return await reply({ text: "❌ Escribe el texto que quieres ocultar.\n\n*Ejemplo:* .spoiler la respuesta es 42" })
    }

    const partes = text.split("|").map(p => p.trim())
    const visible = partes[0]
    const oculto = partes[1] || partes[0]

    const relleno = "\u200e\n".repeat(100)

    const mensaje = `${visible}${relleno}${oculto}`

    await reply({ text: mensaje })
  }
}