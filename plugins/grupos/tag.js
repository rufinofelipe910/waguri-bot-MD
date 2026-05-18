export default {
  name: ["tag", "tagall"],
  description: "Menciona a todos en el grupo",
  groupOnly: true,
  modOnly: true,
  async run({ sock, from, groupMeta, text, reply }) {
    const members = groupMeta?.participants || [];
    const mentions = members.map((m) => m.id);
    const texto = text || "📢 Atención!";
    const lista = members.map((m) => `@${m.id.split("@")[0]}`).join("\n");
    await sock.sendMessage(from, {
      text: `${texto}\n\n${lista}`,
      mentions,
    });
  },
};