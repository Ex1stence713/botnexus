module.exports = {
  name: 'random',
  description: 'Generuje losową liczbę',
  execute(message, args) {
    const min = parseInt(args[0]) || 1;
    const max = parseInt(args[1]) || 100;

    if (isNaN(min) || isNaN(max)) {
      message.reply('❌ Podaj válne liczby!');
      return;
    }

    const random = Math.floor(Math.random() * (max - min + 1)) + min;
    message.reply(`🎲 Wylosowana liczba: **${random}** (z zakresu ${min}-${max})`);
  },
};
