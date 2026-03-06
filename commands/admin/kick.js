import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('kick')
  .setDescription('Wyrzuca użytkownika z serwera')
  .addUserOption(option => option.setName('target').setDescription('Użytkownik do wyrzucenia').setRequired(true))
  .addStringOption(option => option.setName('reason').setDescription('Powód').setRequired(false));

export async function execute(interaction) {
  const { guild, options, member } = interaction;

  if (!guild) return interaction.reply({ content: 'Ta komenda działa tylko na serwerze.', flags: 64 });

  const target = options.getMember('target');
  if (!target) return interaction.reply({ content: 'Nie znaleziono użytkownika na serwerze.', flags: 64 });

  if (target.id === member.id) return interaction.reply({ content: 'Nie możesz wykonać tej akcji na sobie.', flags: 64 });

  const createEmbed = (desc, color = 'Blue') => new EmbedBuilder().setDescription(desc).setColor(color);

  if (!member.permissions.has(PermissionFlagsBits.KickMembers))
    return interaction.reply({ embeds: [createEmbed('Nie masz uprawnień do wyrzucania użytkowników.', 'Red')], flags: 64 });

  if (!guild.members.me.permissions.has(PermissionFlagsBits.KickMembers))
    return interaction.reply({ embeds: [createEmbed('Bot nie ma uprawnień do wyrzucania użytkowników.', 'Red')], flags: 64 });

  if (!target.kickable)
    return interaction.reply({ embeds: [createEmbed('Nie mogę wyrzucić tego użytkownika (zbyt wysoka rola?).', 'Red')], flags: 64 });

  const reason = options.getString('reason') || 'Brak powodu';
  await target.kick(reason);
  await interaction.reply({ embeds: [createEmbed(`Wyrzucono użytkownika **${target.user.tag}**. Powód: ${reason}`, 'Green')] });
}
