const user = interaction.options.getUser('user') || interaction.user;
const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 1024 });
interaction.reply({ content: `Avatar użytkownika ${user.tag}:`, files: [avatarUrl] });