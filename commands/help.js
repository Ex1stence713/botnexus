module.exports = {
  name: 'help',
  description: 'Wyświetla listę wszystkich komend',
  execute(message, args) {
    const helpEmbed = {
      color: 0x0099ff,
      title: '📚 Dostępne Komendy',
      description: 'Oto wszystkie dostępne komendy:',
      fields: [
        {
          name: '!ping',
          value: 'Sprawdza ping bota',
          inline: false,
        },
        {
          name: '!hello',
          value: 'Bot się przywituje',
          inline: false,
        },
        {
          name: '!user',
          value: 'Pokazuje informacje o Tobie',
          inline: false,
        },
        {
          name: '!server',
          value: 'Pokazuje informacje o serwerze',
          inline: false,
        },
        {
          name: '!echo [tekst]',
          value: 'Bot powtórzy Twój tekst',
          inline: false,
        },
        {
          name: '!avatar [użytkownik]',
          value: 'Pokazuje awatar użytkownika',
          inline: false,
        },
        {
          name: '!info',
          value: 'Informacje o bocie',
          inline: false,
        },
        {
          name: '!kick [@użytkownik]',
          value: 'Wyrzuca użytkownika z serwera (admin)',
          inline: false,
        },
        {
          name: '!ban [@użytkownik]',
          value: 'Banuje użytkownika (admin)',
          inline: false,
        },
        {
          name: '!clear [liczba]',
          value: 'Usuwa wiadomości (admin)',
          inline: false,
        },
        {
          name: '!random',
          value: 'Generuje losową liczbę 1-100',
          inline: false,
        },
        {
          name: '!8ball [pytanie]',
          value: 'Magiczna kula odpowiada na pytania',
          inline: false,
        },
        {
          name: '!help',
          value: 'Wyświetla tę wiadomość',
          inline: false,
        },
      ],
      footer: {
        text: 'Prefix: !',
      },
    };
    message.reply({ embeds: [helpEmbed] });
  },
};
