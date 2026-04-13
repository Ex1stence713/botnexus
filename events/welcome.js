import { EmbedBuilder } from 'discord.js';

export default {
  name: "guildMemberAdd",

  async execute(member) {
    const channelId = "1499838770365599941";
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const memberCount = member.guild.memberCount;

    const welcomeEmbed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("👋 Witamy na serwerze!")
      .setDescription(`Cześć **${member.user.username}**! Miło Cię widzieć na naszym serwerze.`)
      .addFields(
        { name: "👥 Członek", value: `#${memberCount}`, inline: true },
        { name: "📅 Dołączył", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({ text: "Zapoznaj się z regulaminem i rozgość się!" })
      .setTimestamp();

    await channel.send({ embeds: [welcomeEmbed] });
  },
};
