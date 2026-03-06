import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
export const data = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Banuje użytkownika')
  .addUserOption(option => option.setName('target').setDescription('Użytkownik do zbanowania').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction) {
  const target = interaction.options.getUser('target');
  const member = await interaction.guild.members.fetch(target.id).catch(() => null);
  if (!member) return await interaction.reply({ content: 'Nie znaleziono użytkownika.', ephemeral: true });

  try {
    await member.ban({ reason: `Zbanowany przez ${interaction.user.tag}` });
    await interaction.reply(`🔨 ${target.tag} został zbanowany.`);
  } catch (err) {
    await interaction.reply({ content: `❌ Błąd: ${err.message}`, ephemeral: true });
  }
}
