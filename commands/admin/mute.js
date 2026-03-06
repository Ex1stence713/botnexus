import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

// Tutaj podaj ID roli mute, która już istnieje na serwerze
const MUTE_ROLE_ID = '1463630780692697201';

export const data = new SlashCommandBuilder()
  .setName('mute')
  .setDescription('Wycisza użytkownika')
  .addUserOption(option => option.setName('target').setDescription('Użytkownik do wyciszenia').setRequired(true))
  .addIntegerOption(option => option.setName('time').setDescription('Czas wyciszenia w minutach').setRequired(false));

export async function execute(interaction) {
  const { guild, options, member } = interaction;

  if (!guild) return interaction.reply({ content: 'Ta komenda działa tylko na serwerze.', flags: 64 });

  const target = options.getMember('target');
  if (!target) return interaction.reply({ content: 'Nie znaleziono użytkownika na serwerze.', flags: 64 });

  if (target.id === member.id) return interaction.reply({ content: 'Nie możesz wykonać tej akcji na sobie.', flags: 64 });

  const createEmbed = (desc, color = 'Blue') => new EmbedBuilder().setDescription(desc).setColor(color);

  if (!member.permissions.has(PermissionFlagsBits.MuteMembers) && !member.permissions.has(PermissionFlagsBits.ManageRoles))
    return interaction.reply({ embeds: [createEmbed('Nie masz uprawnień do wyciszania użytkowników.', 'Red')], flags: 64 });

  if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles))
    return interaction.reply({ embeds: [createEmbed('Bot nie ma uprawnień do zarządzania rolami.', 'Red')], flags: 64 });

  // Pobieramy rolę po ID (z cache)
  const muteRole = guild.roles.cache.get(MUTE_ROLE_ID);
  if (!muteRole) {
    return interaction.reply({ embeds: [createEmbed('Rola Muted o podanym ID nie istnieje na serwerze.', 'Red')], flags: 64 });
  }

  if (target.roles.cache.has(muteRole.id))
    return interaction.reply({ embeds: [createEmbed('Ten użytkownik jest już wyciszony.', 'Red')], flags: 64 });

  await target.roles.add(muteRole);

  const time = options.getInteger('time');
  if (time && time > 0) {
    setTimeout(async () => {
      if (target.roles.cache.has(muteRole.id)) {
        await target.roles.remove(muteRole).catch(() => {});
      }
    }, time * 60 * 1000);
    await interaction.reply({ embeds: [createEmbed(`Wyciszono **${target.user.tag}** na ${time} minut.`, 'Green')] });
  } else {
    await interaction.reply({ embeds: [createEmbed(`Wyciszono **${target.user.tag}**.`, 'Green')] });
  }
}
