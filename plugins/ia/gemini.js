import axios from "axios";

const API_KEY = "NEX-832E11D2E71E43248B668FF2";
const API_URL = "https://nexevo.boxmine.xyz/ai/gemini";

export default {
  name: ["gemini"],
  description: "Conversa con Gemini.",
  category: "ia",
  ownerOnly: false,

  async run({ text, reply, sock, from }) {
    if (!text) {
      return await reply({
        text: `꒰✖️꒱ ᰍ Escrıᑲᧉ tu ⍴ꭇᧉgunt⍺ o mᧉns⍺jᧉ ⍴⍺ꭇ⍺ Gᧉmını.

⎙ *Ejᧉmp𝗅o:* .gemini ¿cómo está el clima hoy?`
      });
    }

    const sent = await reply({
      text: "> *Gemini está procesando tu petición...*"
    });

    try {
      const url = `${API_URL}?text=${encodeURIComponent(text)}&apikey=${API_KEY}`;

      const { data } = await axios.get(url, { timeout: 60000 });

      const responseText = data?.result || data?.response || data?.answer || data?.text || data?.message;

      if (!responseText) {
        console.error("Respuesta inesperada de Gemini:", JSON.stringify(data));
        return await sock.sendMessage(from, {
          text: "❌ No se pudo obtener una respuesta de Gemini.",
          edit: sent.key
        });
      }

      await sock.sendMessage(from, {
        text: responseText,
        edit: sent.key
      });

    } catch (err) {
      console.error("Error en Gemini:", err.message, "| status:", err.response?.status, "| data:", JSON.stringify(err.response?.data));

      await sock.sendMessage(from, {
        text: `❌ Error al consultar Gemini.\n\n${err.message}`,
        edit: sent.key
      });
    }
  }
};