import axios from "axios";

export default {
  name: ["copilot", "ai"],
  description: "Conversa con la IA Copilot.",
  category: "ia",
  ownerOnly: false,

  async run({ text, reply, react }) {
    if (!text) {
      return await reply({
        text: `꒰✖️꒱ ᰍ Escrıᑲᧉ tu ⍴ꭇᧉgunt⍺ o mᧉns⍺jᧉ ⍴⍺ꭇ⍺ Copı𝗅oƚ.

⎙ *Ejᧉmp𝗅o:* .copilot ¿cómo está el clima hoy?`
      });
    }

    await react("🤔");

    try {
      const url = `https://fare.ink/ai/copilot?q=${encodeURIComponent(text)}&model=default`;

      const { data } = await axios.get(url, {
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 30000
      });

      if (!data?.status || !data?.respuesta) {
        await react("❌");
        return await reply({
          text: "❌ No se pudo obtener una respuesta de Copilot."
        });
      }

      await react("✅");

      await reply({
        text: data.respuesta
      });

    } catch (err) {
      console.error("Error en Copilot:", err);

      await react("❌");

      await reply({
        text: `❌ Error al consultar Copilot.\n\n${err.message}`
      });
    }
  }
};