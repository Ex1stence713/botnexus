import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Wyświetla interaktywne menu pomocy');

export async function execute(interaction) {
  // Główne menu (startowe)
  const embed = new EmbedBuilder()
    .setTitle('📚 Menu Pomocy Bota')
    .setDescription('Wybierz interesującą Cię kategorię za pomocą przycisków poniżej, aby zobaczyć dostępne komendy.')
    .setColor('#2B2D31')
    .setThumbnail(interaction.client.user.displayAvatarURL())
    .setFooter({ 
      text: `${interaction.client.user.username} • System pomocy`, 
      iconURL: interaction.client.user.displayAvatarURL() 
    })
    .setTimestamp();

  // Tworzenie przycisków
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('help_fun')
      .setLabel('FUN')
      .setEmoji('🎉')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('help_other')
      .setLabel('INNE')
      .setEmoji('📁')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('help_config')
      .setLabel('KONFIGURACJA')
      .setEmoji('⚙️')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('help_mod')
      .setLabel('MODERACJA')
      .setEmoji('🛡️')
      .setStyle(ButtonStyle.Primary)
  );

  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}