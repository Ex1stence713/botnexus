module.exports = {
  name: 'hello',
  description: 'Bot się przywituje',
  execute(message, args) {
    message.reply(`👋 Cześć ${message.author.username}! Jak się masz?`);
  },
};
