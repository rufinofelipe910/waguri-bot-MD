import axios from "axios";
import FormData from "form-data";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

const API_KEY = "api-uMZCY";
const API_URL = "https://api.alyacore.xyz/ai/gpt-editor";

export default {
  name: ["gpteditor", "editarimg", "imgedit"],
  description: "Edita una imagen usando IA (ChatGPT).",
  category: "ia",
  ownerOnly: false,

  async run({ text, reply, sock, from, msg }) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedImage = quoted?.imageMessage;
    const directImage = msg.message?.imageMessage;

    const targetImageMsg = quotedImage || directImage;
    const prompt = text?.trim();

    if (!targetImageMsg) {
      return await reply({
        text: `꒰✖️꒱ ᰍ Cıᥣ⍺ o ᧉnvı⍺ un⍺ ım⍺gᧉn ⍴⍺ꭇ⍺ ᧉdıᥣ⍺ꭇᥣ⍺ con IA.

⎙ *Ejemplo:* responde a una imagen con .gpteditor pon fondo de playa`
      });
    }

    if (!prompt) {
      return await reply({
        text: "⚠️ Decime qué querés que le haga a la imagen.\n\n*Ejemplo:* .gpteditor pon fondo de playa"
      });
    }

    const sent = await reply({
      text: "> *Editando la imagen con IA, esto puede tardar un poco...*"
    });

    try {
      // Descargamos la imagen citada/enviada como buffer
      const buffer = await downloadMediaMessage(
        { message: quoted ? { imageMessage: quotedImage } : msg.message, key: msg.key },
        "buffer",
        {}
      );

      const form = new FormData();
      form.append("image", buffer, { filename: "image.jpg", contentType: "image/jpeg" });
      form.append("prompt", prompt);
      form.append("key", API_KEY);

      const { data } = await axios.post(API_URL, form, {
        headers: form.getHeaders(),
        timeout: 120000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      const imageUrl = data?.result || data?.image || data?.url || data?.output;

      if (!imageUrl) {
        console.error("Respuesta inesperada de GPT Editor:", JSON.stringify(data));
        return await sock.sendMessage(from, {
          text: "❌ No se pudo editar la imagen.",
          edit: sent.key
        });
      }

      await sock.sendMessage(from, {
        image: { url: imageUrl },
        caption: "✅ Imagen editada",
      }, { quoted: msg });

      await sock.sendMessage(from, { delete: sent.key });

    } catch (err) {
      console.error("Error en GPT Editor:", err.message, "| status:", err.response?.status, "| data:", JSON.stringify(err.response?.data));

      await sock.sendMessage(from, {
        text: `❌ Error al editar la imagen.\n\n${err.message}`,
        edit: sent.key
      });
    }
  }
};
