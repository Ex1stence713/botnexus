import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('serversupport')
  .setDescription('Wyświetla embed z linkiem i opisem do serwera supporta.');

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('Dołącz do naszego serwera supporta!')
    .setDescription('Potrzebujesz pomocy lub masz pytania? Dołącz do naszego serwera supporta, gdzie znajdziesz wsparcie i odpowiedzi na swoje pytania.')
    .addFields({ name: 'Link do serwera:', value: 'https://discord.gg/p8YGTDyxR8' })
    .setColor(0x5865F2)
    .setFooter({ text: 'Zapraszamy serdecznie!' });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}