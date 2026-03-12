import { EmbedBuilder } from 'discord.js';

export default {
  name: "guildMemberRemove",
  
  async execute(member) {
    const channelId = "1463630783418994723";
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const memberCount = member.guild.memberCount;

    const goodbyeEmbed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle("👋 Pożegnanie")
      .setDescription(`**${member.user.username}** opuścił serwer.`)
      .addFields(
        { name: "👥 Członek", value: `#${memberCount}`, inline: true },
        { name: "📅 Dołączył", value: `<t:${Math.floor(member.joinedAt / 1000)}:R>`, inline: true }
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({ text: "Mamy nadzieję, że jeszcze wrócisz!" })
      .setTimestamp();

    await channel.send({ embeds: [goodbyeEmbed] });
  },
};