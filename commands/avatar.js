module.exports = {
  name: 'avatar',
  description: 'Pokazuje awatar użytkownika',
  execute(message, args) {
    const user = message.mentions.users.first() || message.author;
    const avatarEmbed = {
      color: 0xffd700,
      title: `🎨 Awatar - ${user.username}`,
      image: {
        url: user.displayAvatarURL({ size: 1024 }),
      },
      footer: {
        text: `ID: ${user.id}`,
      },
    };
    message.reply({ embeds: [avatarEmbed] });
  },
};
