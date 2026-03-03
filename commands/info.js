module.exports = {
  name: 'info',
  description: 'Informacje o bocie',
  execute(message, args, client) {
    const infoEmbed = {
      color: 0x00ffff,
      title: '🤖 Informacje o Bocie',
      fields: [
        {
          name: 'Nazwa',
          value: client.user.username,
          inline: true,
        },
        {
          name: 'ID',
          value: client.user.id,
          inline: true,
        },
        {
          name: 'Tag',
          value: client.user.tag,
          inline: true,
        },
        {
          name: 'Liczba serwerów',
          value: client.guilds.cache.size.toString(),
          inline: true,
        },
        {
          name: 'Liczba użytkowników',
          value: client.users.cache.size.toString(),
          inline: true,
        },
        {
          name: 'Ping',
          value: `${client.ws.ping}ms`,
          inline: true,
        },
      ],
      thumbnail: {
        url: client.user.displayAvatarURL(),
      },
    };
    message.reply({ embeds: [infoEmbed] });
  },
};
