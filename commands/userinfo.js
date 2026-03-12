import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('userinfo')
  .setDescription('Wyświetla szczegółowe informacje o użytkowniku')
  .addUserOption(option => option.setName('target').setDescription('Wybierz użytkownika'));

export async function execute(interaction) {
  const user = interaction.options.getUser('target') || interaction.user;
  
  // Próba pobrania członka serwera (może być null jeśli użytkownik nie jest na serwerze)
  let member = null;
  try {
    member = await interaction.guild.members.fetch(user.id).catch(() => null);
  } catch (e) {
    member = null;
  }

  const embed = new EmbedBuilder()
    .setTitle(`Informacje o ${user.username}`)
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setColor('#5865F2')
    .addFields(
      { name: '🆔 ID', value: user.id, inline: true },
      { name: '📅 Konto założono', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
      { name: '📥 Dołączył na serwer', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Brak danych', inline: true },
      { name: '👑 Najwyższa rola', value: member ? `${member.roles.highest}` : 'Brak', inline: true }
    )
    .setFooter({ text: `Zapytanie od: ${interaction.user.tag}` });

  await interaction.reply({ embeds: [embed] });
}