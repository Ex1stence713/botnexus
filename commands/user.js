module.exports = {
  name: 'user',
  description: 'Pokazuje informacje o użytkowniku',
  execute(message, args) {
    const userEmbed = {
      color: 0x00ff00,
      title: '👤 Informacje o Tobie',
      fields: [
        {
          name: 'Nazwa użytkownika',
          value: message.author.username,
          inline: true,
        },
        {
          name: 'ID',
          value: message.author.id,
          inline: true,
        },
        {
          name: 'Bot?',
          value: message.author.bot ? 'Tak' : 'Nie',
          inline: true,
        },
        {
          name: 'Konto utworzone',
          value: message.author.createdAt.toDateString(),
          inline: true,
        },
      ],
      thumbnail: {
        url: message.author.displayAvatarURL(),
      },
    };
    message.reply({ embeds: [userEmbed] });
  },
};
