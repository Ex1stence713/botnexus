module.exports = {
  name: 'kick',
  description: 'Wyrzuca użytkownika z serwera',
  execute(message, args) {
    if (!message.member.permissions.has('KickMembers')) {
      message.reply('❌ Nie masz uprawnień do wyrzucania użytkowników!');
      return;
    }

    const user = message.mentions.users.first();
    if (!user) {
      message.reply('❌ Musisz wspomnieć użytkownika!');
      return;
    }

    const member = message.guild.members.cache.get(user.id);
    if (!member) {
      message.reply('❌ Użytkownik nie znaleziony na tym serwerze!');
      return;
    }

    member.kick('Wyrzucony przez bota').then(() => {
      message.reply(`✅ ${user.tag} został wyrzucony z serwera!`);
    }).catch(() => {
      message.reply('❌ Nie mogę wyrzucić tego użytkownika!');
    });
  },
};
