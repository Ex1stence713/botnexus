import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('clear')
  .setDescription('Czyści wiadomości')
  .addIntegerOption(option =>
    option.setName('ilość')
      .setDescription('Liczba wiadomości do usunięcia')
      .setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction) {
  const amount = interaction.options.getInteger('ilość');
  const channel = interaction.channel;
  await channel.bulkDelete(amount, true);
  await interaction.reply({ content: `🧹 Usunięto ${amount} wiadomości.`, ephemeral: true });
}
