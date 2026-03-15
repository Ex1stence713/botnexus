import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('roleinfo')
  .setDescription('Wyświetla informacje o roli')
  .addRoleOption(option =>
    option.setName('rola')
      .setDescription('Wybierz rolę')
      .setRequired(true)
  );

export async function execute(interaction) {
  const role = interaction.options.getRole('rola');
  
  const roleInfoEmbed = new EmbedBuilder()
    .setTitle(`📋 Informacje o roli: ${role.name}`)
    .setColor(role.color || 0x000000)
    .addFields(
      { name: '🆔 ID roli', value: role.id, inline: true },
      { name: '🎨 Kolor', value: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : 'Brak', inline: true },
      { name: '👥 Liczba członków', value: `${role.members.size}`, inline: true },
      { name: '📅 Utworzona', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:D>`, inline: true },
      { name: '🏷️ Mentionable', value: role.mentionable ? 'Tak' : 'Nie', inline: true },
      { name: '🔒 Managed', value: role.managed ? 'Tak' : 'Nie', inline: true }
    )
    .setFooter({ text: 'BotNexus' })
    .setTimestamp();

  await interaction.reply({ embeds: [roleInfoEmbed] });
}
