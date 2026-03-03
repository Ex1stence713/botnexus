module.exports = {
  name: 'echo',
  description: 'Bot powtórzy Twój tekst',
  execute(message, args) {
    const text = args.join(' ');
    if (!text) {
      message.reply('❌ Nie podałeś żadnego tekstu!');
      return;
    }
    message.reply(`🔊 ${text}`);
  },
};
