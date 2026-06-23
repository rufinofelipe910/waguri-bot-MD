export default {
  name: ["spoiler"],
  description: "Envía un mensaje largo que WhatsApp trunca con 'Leer más'",
  category: "utils",
  ownerOnly: false,

  async run({ reply, text }) {
    if (!text) {
      return await reply({ text: "❌ Escribe el texto que quieres ocultar.\n\n*Ejemplo:* .spoiler la respuesta es 42" })
    }

    const partes = text.split("|").map(p => p.trim())
    const visible = partes[0]
    const oculto = partes[1] || partes[0]

    // Relleno como UNA sola línea continua (sin saltos), para que WhatsApp
    // trunque por longitud de caracteres y no por cantidad de líneas.
    const relleno = "‎ ".repeat(800)

    const mensaje = `${visible}${relleno}${oculto}`

    await reply({ text: mensaje })
  }
}