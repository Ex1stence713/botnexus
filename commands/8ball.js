module.exports = {
  name: '8ball',
  description: 'Magiczna kula odpowiada na pytania',
  execute(message, args) {
    const responses = [
      'Tak, oczywiście! ✅',
      'Nie, zdecydowanie! ❌',
      'Być może... 🤔',
      'To skomplikowane... 😕',
      'Pytaj później! ⏳',
      'Naprawdę tak myślisz? 🙃',
      'Zdecydowanie tak! 🎉',
      'Nie ma szans! 🚫',
      'Zamiast tego rób coś pożytecznego! 😂',
      'Hahaha nie! 😄',
      'Tak! 100%! 🔥',
      'Nie mam pojęcia... 👽',
      'Powiedz to światu! 🌍',
      'Może lepiej się nie dowiesz 👻',
      'Spróbuj jutro ☀️',
    ];

    if (args.length === 0) {
      message.reply('❌ Musisz zadać pytanie magicznej kuli! Użyj: `!8ball [pytanie]`');
      return;
    }

    const question = args.join(' ');
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    const ballEmbed = {
      color: 0x000000,
      title: '🔮 Magiczna Kula',
      description: `**Pytanie:** ${question}\n\n**Odpowiedź:** ${randomResponse}`,
      footer: {
        text: 'Magiczna kula się wypowiedziała!',
      },
    };

    message.reply({ embeds: [ballEmbed] });
  },
};
