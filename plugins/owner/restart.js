import { execSync } from "child_process";

export default {
  name: ["restart", "reiniciar"],
  description: "Reinicia el proceso del bot",
  category: 'owner',
  ownerOnly: true,

  async run({ reply, react }) {
    try {
      await react("🔄");
      await reply({ text: "♻️ *Reiniciando el bot...*\n_Esto puede tardar unos segundos._" });

      setTimeout(() => {
        execSync("npm restart", { stdio: "ignore" });
      }, 1000);

    } catch (err) {
      await react("❌");
      await reply({ text: `❌ *Error al reiniciar:* ${err.message}` });
    }
  },
};