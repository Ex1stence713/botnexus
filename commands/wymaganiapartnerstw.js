import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('wymaganiapartnerstw')
  .setDescription('Wyświetla szczegółowe wymagania dotyczące partnerstw na tym serwerze.');

export async function execute(interaction) {
  try {
    const embed = new EmbedBuilder()
      .setColor('#00C3FF')
      .setTitle('✨ Wymagania Partnerstw')
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/616/616494.png')
      .setDescription(
        'Chcesz nawiązać **partnerstwo** z naszym serwerem?\n' +
        'Zapoznaj się z wymaganiami i dołącz do naszej społeczności partnerów!\n\n' +
        '> **Partnerstwo to szansa na rozwój i wspólne akcje!**'
      )
      .addFields(
        { name: '1✮⋆˙ Serwer nie może być typu NSFW', value: 'Serwer musi być odpowiedni dla wszystkich kategorii wiekowych.', inline: false },
        { name: '2✮⋆˙ Minimalna liczba aktywnych członków', value: 'Serwer musi posiadać **minimum 50 aktywnych członków** (bez botów).', inline: false },
        { name: '3✮⋆˙ Opuszczenie serwera', value: 'W przypadku opuszczenia serwera przez osobę zawierającą partnerstwo, **reklama zostaje usunięta**.', inline: false },
        { name: '4✮⋆˙ Jak się zgłosić?', value: 'Aby nawiązać partnerstwo, zrób ticketa w <#1429200341970190417>\n\n**Każdy właściciel partnerskiego serwera otrzymuje rangę** <@&1429201517042466837>', inline: false },
        { name: '5✮⋆˙ Aktywności', value: 'W przypadku braku aktywności na serwerze reklama zostaje usunięta.', inline: false }
      )
      .setFooter({ text: 'Masz pytania? Skontaktuj się z administracją!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Błąd przy wykonywaniu komendy.', ephemeral: true });
    }
    console.error(error);
  }
}