import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

const MUTE_ROLE_ID = '1463630780692697201';

export const data = new SlashCommandBuilder()
  .setName('unmute')
  .setDescription('Odcisza użytkownika')
  .addUserOption(option => option.setName('target').setDescription('Użytkownik do odciszenia').setRequired(true));

export async function execute(interaction) {
  const { guild, options, member } = interaction;

  if (!guild) return interaction.reply({ content: 'Ta komenda działa tylko na serwerze.', flags: 64 });

  const target = options.getMember('target');
  if (!target) return interaction.reply({ content: 'Nie znaleziono użytkownika na serwerze.', flags: 64 });

  if (!member.permissions.has(PermissionFlagsBits.ManageRoles))
    return interaction.reply({ content: 'Nie masz uprawnień do odciszania użytkowników.', flags: 64 });

  if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles))
    return interaction.reply({ content: 'Bot nie ma uprawnień do zarządzania rolami.', flags: 64 });

  const muteRole = guild.roles.cache.get(MUTE_ROLE_ID);
  if (!muteRole) return interaction.reply({ content: 'Rola Muted nie istnieje.', flags: 64 });

  if (!target.roles.cache.has(muteRole.id))
    return interaction.reply({ content: 'Ten użytkownik nie jest wyciszony.', flags: 64 });

  await target.roles.remove(muteRole);
  await interaction.reply({ content: `Odciszono **${target.user.tag}**.` });
}
