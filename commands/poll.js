import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('poll')
  .setDescription('Tworzy ankietę')
  .addStringOption(option =>
    option.setName('pytanie')
      .setDescription('Pytanie ankiety')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('opcje')
      .setDescription('Opcje oddzielone średnikiem (np. Tak;Nie;Może)')
      .setRequired(true)
  );

export async function execute(interaction) {
  const question = interaction.options.getString('pytanie');
  const optionsString = interaction.options.getString('opcje');
  const options = optionsString.split(';').map(o => o.trim()).filter(o => o.length > 0);

  if (options.length < 2) {
    return interaction.reply({ content: '❌ Musisz podać co najmniej 2 opcje oddzielone średnikiem!', ephemeral: true });
  }

  if (options.length > 5) {
    return interaction.reply({ content: '❌ Maksymalnie 5 opcji!', ephemeral: true });
  }

  const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
  const pollEmbed = {
    title: '📊 Ankieta',
    description: `**${question}**`,
    color: 0x5865F2,
    fields: options.map((opt, i) => ({
      name: `${emojis[i]} ${opt}`,
      value: '0 głosów',
      inline: true
    })),
    footer: { text: 'BotNexus • Głosuj klikając poniżej' },
    timestamp: new Date().toISOString()
  };

  const row = new ActionRowBuilder();
  options.forEach((_, i) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`poll_${i}`)
        .setLabel(emojis[i])
        .setStyle(ButtonStyle.Primary)
    );
  });

  await interaction.reply({ embeds: [pollEmbed], components: [row] });
}
