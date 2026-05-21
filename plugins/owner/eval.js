export default {
  name: ["eval", "exec", ">"],
  description: "Evalúa código JavaScript",
  ownerOnly: true,
  async run({ reply, text, sock, from, msg }) {
    try {
      let result = await eval(`(async () => { ${text} })()`);
      if (typeof result !== "string") result = JSON.stringify(result, null, 2);
      await reply({ text: `✅ *Resultado:*\n\`\`\`${result}\`\`\`` });
    } catch (e) {
      await reply({ text: `❌ *Error:*\n\`\`\`${e.message}\`\`\`` });
    }
  },
};
