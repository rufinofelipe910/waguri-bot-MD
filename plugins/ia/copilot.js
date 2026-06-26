import axios from "axios";

export default {
  name: ["copilot", "ai"],
  description: "Conversa con la IA Copilot.",
  category: "ia",
  ownerOnly: false,

  async run({ text, reply, sock, from }) {
    if (!text) {
      return await reply({
        text: `꒰✖️꒱ ᰍ Escrıᑲᧉ tu ⍴ꭇᧉgunt⍺ o mᧉns⍺jᧉ ⍴⍺ꭇ⍺ Copı𝗅oƚ.

⎙ *Ejᧉmp𝗅o:* .copilot ¿cómo está el clima hoy?`
      });
    }

    const sent = await reply({
      text: "> *Copilot está procesando tu petición...*"
    });

    try {
      const url = `https://fare.ink/ai/copilot?q=${encodeURIComponent(text)}&model=default`;

      const { data } = await axios.get(url, {
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 60000
      });

      const responseText = data?.respuesta || data?.result || data?.response || data?.answer || data?.text;

      if (!data?.status || !responseText) {
        return await sock.sendMessage(from, {
          text: "❌ No se pudo obtener una respuesta de Copilot.",
          edit: sent.key
        });
      }

      await sock.sendMessage(from, {
        text: responseText,
        edit: sent.key
      });

    } catch (err) {
      console.error("Error en Copilot:", err);

      await sock.sendMessage(from, {
        text: `❌ Error al consultar Copilot.\n\n${err.message}`,
        edit: sent.key
      });
    }
  }
};