module.exports = {
  name: 'clear',
  description: 'Usuwa wiadomości z kanału',
  execute(message, args) {
    if (!message.member.permissions.has('ManageMessages')) {
      message.reply('❌ Nie masz uprawnień do usuwania wiadomości!');
      return;
    }

    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100) {
      message.reply('❌ Podaj liczbę między 1 a 100!');
      return;
    }

    message.channel.bulkDelete(amount).then(() => {
      message.reply(`✅ Usunęłem ${amount} wiadomości!`).then(msg => {
        setTimeout(() => msg.delete(), 3000);
      });
    }).catch(() => {
      message.reply('❌ Nie mogę usunąć wiadomości!');
    });
  },
};
