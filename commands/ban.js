module.exports = {
  name: 'ban',
  description: 'Banuje użytkownika',
  execute(message, args) {
    if (!message.member.permissions.has('BanMembers')) {
      message.reply('❌ Nie masz uprawnień do banowania użytkowników!');
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

    member.ban({ reason: 'Zbanowany przez bota' }).then(() => {
      message.reply(`✅ ${user.tag} został zbanowany!`);
    }).catch(() => {
      message.reply('❌ Nie mogę zabanować tego użytkownika!');
    });
  },
};
