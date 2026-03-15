import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('say')
  .setDescription('Bot wysyła wiadomość')
  .addStringOption(option =>
    option.setName('tekst')
      .setDescription('Tekst do wysłania')
      .setRequired(true)
  )
  .addBooleanOption(option =>
    option.setName('embed')
      .setDescription('Czy wysłać jako embed?')
  );

export async function execute(interaction) {
  const text = interaction.options.getString('tekst');
  const embed = interaction.options.getBoolean('embed') || false;

  // Usuń wiadomość użytkownika
  if (interaction.channel) {
    try {
      await interaction.deleteReply();
    } catch (e) {
      // Ignoruj błędy
    }
  }

  if (embed) {
    const { EmbedBuilder } = await import('discord.js');
    const embedMessage = new EmbedBuilder()
      .setDescription(text)
      .setColor(0x5865F2);
    
    await interaction.channel.send({ embeds: [embedMessage] });
  } else {
    await interaction.channel.send(text);
  }
}
