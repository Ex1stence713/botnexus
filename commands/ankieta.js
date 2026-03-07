import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('poll')
  .setDescription('Tworzy profesjonalną ankietę z przyciskami')
  .addStringOption(option => option.setName('pytanie').setDescription('Treść pytania').setRequired(true))
  .addStringOption(option => option.setName('opcja1').setDescription('Pierwsza opcja').setRequired(true))
  .addStringOption(option => option.setName('opcja2').setDescription('Druga opcja').setRequired(true));

export async function execute(interaction) {
  const question = interaction.options.getString('pytanie');
  const opt1 = interaction.options.getString('opcja1');
  const opt2 = interaction.options.getString('opcja2');

  const embed = new EmbedBuilder()
    .setTitle('📊 Głosowanie')
    .setDescription(`**${question}**\n\n🟦: ${opt1}\n🟥: ${opt2}`)
    .setColor('#5865F2')
    .setFooter({ text: `Ankieta rozpoczęta przez: ${interaction.user.tag}` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('poll_1').setLabel(opt1).setStyle(ButtonStyle.Primary).setEmoji('🟦'),
    new ButtonBuilder().setCustomId('poll_2').setLabel(opt2).setStyle(ButtonStyle.Danger).setEmoji('🟥')
  );

  await interaction.reply({ embeds: [embed], components: [row] });
}