import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  PermissionFlagsBits 
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('changelog')
  .setDescription('Publikuje estetyczne nowości na serwerze')
  .addStringOption(option =>
    option.setName('tytul')
      .setDescription('Tytuł aktualizacji (np. Wersja 2.0)')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('tresc')
      .setDescription('Użyj ";" aby rozdzielić punkty nowości')
      .setRequired(true)
  )
  .addChannelOption(option =>
    option.setName('kanal')
      .setDescription('Gdzie wysłać wiadomość?')
      .setRequired(true)
  )
  .addRoleOption(option =>
    option.setName('ping')
      .setDescription('Rola do oznaczenia')
  )
  .addStringOption(option =>
    option.setName('obraz')
      .setDescription('Link do dużego obrazka pod treścią')
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction) {
  const title = interaction.options.getString('tytul');
  const contentRaw = interaction.options.getString('tresc');
  const channel = interaction.options.getChannel('kanal');
  const pingRole = interaction.options.getRole('ping');
  const image = interaction.options.getString('obraz');

  if (!channel.isTextBased()) {
    return interaction.reply({
      content: '❌ Wybrany kanał musi być tekstowy.',
      ephemeral: true
    });
  }

  // Automatyczne formatowanie punktów (jeśli użytkownik użyje średnika ;)
  const formattedContent = contentRaw
    .split(';')
    .map(line => `• ${line.trim()}`)
    .join('\n');

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `Aktualizacja: ${interaction.guild.name}`,
      iconURL: interaction.guild.iconURL({ dynamic: true })
    })
    .setTitle(`✨ ${title}`)
    .setDescription(`\n${formattedContent}\n\n`)
    .setColor('#5865F2') // Blurple - klasyczny kolor Discorda
    .addFields(
      {
        name: '🛠️ Deweloper',
        value: `${interaction.user}`,
        inline: true
      },
      {
        name: '📅 Data',
        value: `<t:${Math.floor(Date.now() / 1000)}:d>`, // Krótka data
        inline: true
      }
    )
    .setFooter({
      text: `Wersja produkcyjna • ${interaction.guild.name}`,
    })
    .setTimestamp();

  if (image) {
    // Sprawdzanie czy link jest poprawnym URL (opcjonalnie)
    if (image.startsWith('http')) {
        embed.setImage(image);
    }
  }

  try {
    const mention = pingRole ? `${pingRole}` : '';

    await channel.send({
      content: mention,
      embeds: [embed]
    });

    await interaction.reply({
      content: `✅ Pomyślnie opublikowano nowości na kanale ${channel}`,
      ephemeral: true
    });

  } catch (err) {
    console.error(err);
    return interaction.reply({
      content: '❌ Nie udało się wysłać changelogu. Sprawdź moje uprawnienia na tamtym kanale.',
      ephemeral: true
    });
  }
}