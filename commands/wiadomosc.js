import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('dm')
  .setDescription('Wyślij prywatną wiadomość do użytkownika (DM).')
  .addUserOption(opt => opt.setName('user').setDescription('Użytkownik, do którego wysyłasz DM').setRequired(true))
  .addStringOption(opt => opt.setName('message').setDescription('Treść wiadomości').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const target = interaction.options.getUser('user');
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

  // Próba wysłania DM
  try {
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

    await target.send({ embeds: [dmEmbed] });

    // Log
    console.log(`DM wysłane do ${target.tag} (${target.id}) przez ${interaction.user.tag}`);

    return interaction.editReply({ content: `✅ Wiadomość wysłana do ${target.tag}.` });
  } catch (err) {
    // Możliwe powody błędu: użytkownik ma zablokowane DMy od serwera/bota, bot zbanowany itp.
    console.error('Błąd przy wysyłaniu DM:', err);
    return interaction.editReply({
      content: `❌ Nie udało się wysłać DM — możliwe, że użytkownik ma zablokowane prywatne wiadomości lub wystąpił błąd.`,
    });
  }
}
