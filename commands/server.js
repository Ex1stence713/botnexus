module.exports = {
  name: 'server',
  description: 'Pokazuje informacje o serwerze',
  execute(message, args) {
    const serverEmbed = {
      color: 0xff00ff,
      title: '🏰 Informacje o Serwerze',
      fields: [
        {
          name: 'Nazwa serwera',
          value: message.guild.name,
          inline: true,
        },
        {
          name: 'ID serwera',
          value: message.guild.id,
          inline: true,
        },
        {
          name: 'Właściciel',
          value: `<@${message.guild.ownerId}>`,
          inline: true,
        },
        {
          name: 'Liczba członków',
          value: message.guild.memberCount.toString(),
          inline: true,
        },
        {
          name: 'Liczba kanałów',
          value: message.guild.channels.cache.size.toString(),
          inline: true,
        },
        {
          name: 'Liczba ról',
          value: message.guild.roles.cache.size.toString(),
          inline: true,
        },
      ],
      thumbnail: {
        url: message.guild.iconURL(),
      },
    };
    message.reply({ embeds: [serverEmbed] });
  },
};
