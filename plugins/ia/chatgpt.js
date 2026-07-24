import axios from "axios";

const API_KEY = "api-uMZCY";
const API_URL = "https://api.alyacore.xyz/ai/chatgpt";

export default {
  name: ["chatgpt", "gpt"],
  description: "Conversa con ChatGPT.",
  category: "ia",
  ownerOnly: false,

  async run({ text, reply, sock, from }) {
    if (!text) {
      return await reply({
        text: `꒰✖️꒱ ᰍ Escrıᑲᧉ tu ⍴ꭇᧉgunt⍺ o mᧉns⍺jᧉ ⍴⍺ꭇ⍺ Ch⍺tGPT.

⎙ *Ejᧉmp𝗅o:* .chatgpt ¿cómo está el clima hoy?`
      });
    }

    const sent = await reply({
      text: "> *ChatGPT está procesando tu petición...*"
    });

    try {
      const url = `${API_URL}?text=${encodeURIComponent(text)}&key=${API_KEY}`;

      const { data } = await axios.get(url, { timeout: 60000 });

      const responseText = data?.result || data?.response || data?.answer || data?.text || data?.message;

      if (!responseText) {
        console.error("Respuesta inesperada de ChatGPT:", JSON.stringify(data));
        return await sock.sendMessage(from, {
          text: "❌ No se pudo obtener una respuesta de ChatGPT.",
          edit: sent.key
        });
      }

      await sock.sendMessage(from, {
        text: responseText,
        edit: sent.key
      });

    } catch (err) {
      console.error("Error en ChatGPT:", err);

      await sock.sendMessage(from, {
        text: `❌ Error al consultar ChatGPT.\n\n${err.message}`,
        edit: sent.key
      });
    }
  }
};
