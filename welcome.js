export default {
  name: "guildMemberAdd",

  async execute(member) {
    const channelId = "1463630782412357785";
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const message = `👋 **Witamy na serwerze!**

Cześć ${member.user}!
Miło Cię tutaj widzieć. Rozgość się, zapoznaj z regulaminem i zajrzyj na dostępne kanały 😊

Jeśli czegoś potrzebujesz, śmiało pytaj administrację lub innych członków!
`;

    await channel.send({ content: message });
  },
};
