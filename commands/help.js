import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Wyświetla listę wszystkich komend.');

export async function execute(interaction) {
  const commands = Array.from(interaction.client.commands.values());
  const categories = {};

  for (const cmd of commands) {
    const cat = interaction.client.categoryMap?.get(cmd.data.name) || 'general';
    if (!categories[cat]) categories[cat] = [];
    const desc = cmd.data?.description || '';
    // format as `/name — description`
    categories[cat].push(`/${cmd.data.name} — ${desc}`);
  }

  const helpEmbed = new EmbedBuilder()
    .setTitle('📚 Wszystkie Komendy Bota')
    .setDescription('Poniżej znajdziesz listę wszystkich dostępnych komend.')
    .setColor(0x5865F2);

  for (const [cat, list] of Object.entries(categories)) {
    let title = '🌐 Komendy Ogólne';
    if (cat.toLowerCase() === 'admin') title = '🛡️ Komendy Administracyjne';
    else if (cat.toLowerCase() === 'info') title = 'ℹ️ Komendy Informacyjne';

    helpEmbed.addFields({ name: title, value: list.join('\n') || 'Brak komend', inline: false });
  }

  helpEmbed.setFooter({ text: 'Wersja 1.0 • Aby uzyskać więcej informacji o danej komendzie, użyj /help' })
    .setTimestamp();

  await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
}
