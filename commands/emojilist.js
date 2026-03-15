import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('emojilist')
  .setDescription('Wyświetla listę emoji na serwerze');

export async function execute(interaction) {
  const guild = interaction.guild;
  const emojis = guild.emojis.cache;

  if (emojis.size === 0) {
    return interaction.reply('❌ Na tym serwerze nie ma żadnych emoji!');
  }

  const emojiList = emojis.map(e => `${e} \`${e.name}\``).join('\n');
  
  const chunks = [];
  const chunkSize = 20;
  const emojiArray = emojis.map(e => `${e} \`${e.name}\``);
  
  for (let i = 0; i < emojiArray.length; i += chunkSize) {
    chunks.push(emojiArray.slice(i, i + chunkSize).join('\n'));
  }

  const embed = new EmbedBuilder()
    .setTitle('😀 Lista Emoji Serwera')
    .setDescription(`Łącznie: ${emojis.size} emoji`)
    .setColor(0x5865F2)
    .setFooter({ text: 'BotNexus' })
    .setTimestamp();

  if (chunks.length === 1) {
    embed.addFields({ name: 'Emoji', value: emojiList || 'Brak', inline: false });
    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({ embeds: [embed] });
    
    for (const chunk of chunks) {
      const chunkEmbed = new EmbedBuilder()
        .setColor(0x5865F2)
        .addFields({ name: 'Emoji', value: chunk, inline: false })
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();
      
      await interaction.channel.send({ embeds: [chunkEmbed] });
    }
  }
}
