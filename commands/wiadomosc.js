import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('dm')
  .setDescription('Wyślij prywatną wiadomość do wszystkich użytkowników z określoną rolą.')
  .addRoleOption(opt => opt.setName('rola').setDescription('Rola, do której wysyłasz wiadomość').setRequired(true))
  .addStringOption(opt => opt.setName('message').setDescription('Treść wiadomości').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const role = interaction.options.getRole('rola');
  const text = interaction.options.getString('message');

  // Zabezpieczenie: tylko właściciel bota lub osoby z uprawnieniami ManageGuild mogą użyć komendy
  const ownerId = process.env.BOT_OWNER_ID; // ustaw w env lub wpisz tu swój ID
  const member = interaction.member;

  const isOwner = interaction.user.id === ownerId;
  const hasPerm = member?.permissions?.has?.(PermissionFlagsBits.ManageGuild);

  if (!isOwner && !hasPerm) {
    return interaction.editReply({ content: 'Nie masz uprawnień do użycia tej komendy.' });
  }

  // Prosta ochrona przed nadużyciem (limit długości)
  if (text.length > 2000) {
    return interaction.editReply({ content: 'Wiadomość jest za długa — max 2000 znaków.' });
  }

  // Pobierz wszystkich członków serwera z daną rolą
  const guild = interaction.guild;
  const roleMembers = role.members;

  if (roleMembers.size === 0) {
    return interaction.editReply({ content: `Nie znaleziono użytkowników z rolą ${role.name}.` });
  }

  // Tworzymy embed dla wiadomości
  const dmEmbed = new EmbedBuilder()
    .setTitle('📨 Nowa Wiadomość')
    .setDescription(text)
    .setColor(0x5865F2) // Discord niebieskie
    .addFields(
      { name: '👤 Od', value: interaction.user.tag, inline: true },
      { name: '🏢 Serwer', value: interaction.guild?.name ?? 'DM', inline: true },
      { name: '⏰ Czas', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: false }
    )
    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: 'Wiadomość wysłana przez bota serwera' })
    .setTimestamp();

  // Wysyłanie wiadomości do wszystkich członków z rolą
  let successCount = 0;
  let failCount = 0;
  const failedUsers = [];

  for (const [memberId, memberUser] of roleMembers) {
    try {
      await memberUser.send({ embeds: [dmEmbed] });
      successCount++;
    } catch (err) {
      failCount++;
      failedUsers.push(memberUser.tag);
      console.error(`Błąd przy wysyłaniu DM do ${memberUser.tag}:`, err);
    }
  }

  // Log
  console.log(`Wiadomość wysłana do ${successCount} użytkowników z rolą ${role.name} przez ${interaction.user.tag}`);

  // Embed z wynikami
  const resultEmbed = new EmbedBuilder()
    .setTitle('✅ Wysyłanie zakończone')
    .setColor(failCount > 0 ? 0xFEE75C : 0x57F287)
    .addFields(
      { name: '✅ Wysłane', value: `${successCount}`, inline: true },
      { name: '❌ Niepowodzenia', value: `${failCount}`, inline: true },
      { name: '👥 Rola', value: role.name, inline: false }
    )
    .setTimestamp();

  if (failedUsers.length > 0 && failedUsers.length <= 5) {
    resultEmbed.addFields(
      { name: '⚠️ Niepowodzenia', value: failedUsers.join(', '), inline: false }
    );
  }

  return interaction.editReply({ embeds: [resultEmbed] });
}
