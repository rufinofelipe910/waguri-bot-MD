import axios from "axios";

const API_KEY = "api-uMZCY";
const API_URL = "https://api.alyacore.xyz/ai/deepseek";

export default {
  name: ["deepseek"],
  description: "Conversa con DeepSeek.",
  category: "ia",
  ownerOnly: false,

  async run({ text, reply, sock, from }) {
    if (!text) {
      return await reply({
        text: `꒰✖️꒱ ᰍ Escrıᑲᧉ tu ⍴ꭇᧉgunt⍺ o mᧉns⍺jᧉ ⍴⍺ꭇ⍺ DᧉᧉpSᧉᧉk.

⎙ *Ejᧉmp𝗅o:* .deepseek ¿cómo está el clima hoy?`
      });
    }

    const sent = await reply({
      text: "> *DeepSeek está procesando tu petición...*"
    });

    try {
      const url = `${API_URL}?text=${encodeURIComponent(text)}&key=${API_KEY}`;

      const { data } = await axios.get(url, { timeout: 60000 });

      const responseText = data?.result || data?.response || data?.answer || data?.text || data?.message;

      if (!responseText) {
        console.error("Respuesta inesperada de DeepSeek:", JSON.stringify(data));
        return await sock.sendMessage(from, {
          text: "❌ No se pudo obtener una respuesta de DeepSeek.",
          edit: sent.key
        });
      }

      await sock.sendMessage(from, {
        text: responseText,
        edit: sent.key
      });

    } catch (err) {
      console.error("Error en DeepSeek:", err.message, "| status:", err.response?.status, "| data:", JSON.stringify(err.response?.data));

      await sock.sendMessage(from, {
        text: `❌ Error al consultar DeepSeek.\n\n${err.message}`,
        edit: sent.key
      });
    }
  }
};
