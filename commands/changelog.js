import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  PermissionFlagsBits 
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('changelog')
  .setDescription('Publikuje nowości na serwerze')
  .addStringOption(option =>
    option.setName('tytul')
      .setDescription('Tytuł changelogu')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('tresc')
      .setDescription('Treść nowości')
      .setRequired(true)
  )
  .addChannelOption(option =>
    option.setName('kanal')
      .setDescription('Kanał do wysłania')
      .setRequired(true)
  )
  .addRoleOption(option =>
    option.setName('ping')
      .setDescription('Rola do oznaczenia')
  )
  .addStringOption(option =>
    option.setName('miniatura')
      .setDescription('Link do obrazka / miniaturki')
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction) {

  const title = interaction.options.getString('tytul');
  const content = interaction.options.getString('tresc');
  const channel = interaction.options.getChannel('kanal');
  const pingRole = interaction.options.getRole('ping');
  const thumbnail = interaction.options.getString('miniatura');

  if (!channel || !channel.isTextBased()) {
    return interaction.reply({
      content: '❌ Wybierz poprawny kanał tekstowy.',
      ephemeral: true
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(`📢 ${title}`)
    .setDescription(`> ${content}`)
    .setColor('#2B2D31')
    .addFields(
      {
        name: '👤 Autor',
        value: `${interaction.user}`,
        inline: true
      },
      {
        name: '📅 Data publikacji',
        value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
        inline: true
      }
    )
    .setFooter({
      text: `${interaction.guild.name} • Changelog`,
      iconURL: interaction.guild.iconURL({ dynamic: true })
    })
    .setTimestamp();

  if (thumbnail) {
    embed.setImage(thumbnail);
  }

  try {

    const mention = pingRole ? `${pingRole}` : '';

    await channel.send({
      content: mention,
      embeds: [embed]
    });

    await interaction.reply({
      content: `✅ Changelog wysłany do <#${channel.id}>`,
      ephemeral: true
    });

  } catch (err) {
    console.error(err);

    return interaction.reply({
      content: '❌ Wystąpił błąd przy wysyłaniu.',
      ephemeral: true
    });
  }
}
