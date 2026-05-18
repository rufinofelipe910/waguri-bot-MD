export default {
  name: ["ping", "speed"],
  description: "Mide la latencia del bot",
  ownerOnly: false,
  async run({ reply, react }) {
    const start = Date.now();
    await react("🏓");
    const ms = Date.now() - start;
    await reply({ text: `🏓 *Pong!*\n⚡ Latencia: *${ms}ms*` });
  },
};