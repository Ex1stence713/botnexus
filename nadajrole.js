import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('nadaj-role')
  .setDescription('Nadaje wybraną rolę wszystkim użytkownikom na serwerze')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addRoleOption(option =>
    option.setName('rola')
      .setDescription('Rola którą chcesz nadać')
      .setRequired(true));

export async function execute(interaction) {
  await interaction.deferReply();

  const role = interaction.options.getRole('rola');
  
  if (!role) {
    return interaction.editReply('Nie znaleziono wybranej roli');
  }

  try {
    const members = await interaction.guild.members.fetch({ limit: 1000, time: 30000 });
    let count = 0;

    for (const member of members.values()) {
      if (!member.user.bot && !member.roles.cache.has(role.id)) {
        try {
          await member.roles.add(role);
          count++;
        } catch (err) {
          console.log(`Nie udało się nadać roli: ${member.user.tag}`);
        }
      }
    }

    await interaction.editReply(`✅ Nadano rolę ${count} użytkownikom`);
  } catch (error) {
    console.error('Błąd:', error);
    await interaction.editReply('Wystąpił błąd przy nadawaniu ról');
  }
}
