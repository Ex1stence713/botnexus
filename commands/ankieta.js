import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

export const data = new SlashCommandBuilder()
  .setName('ankieta')
  .setDescription('Tworzy prostą ankietę z kilkoma opcjami.')
  .addStringOption(option =>
    option.setName('pytanie')
      .setDescription('Treść pytania ankiety')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('opcje')
      .setDescription('Opcje rozdzielone przecinkami (np. tak, nie, może)')
      .setRequired(true))
  .addRoleOption(option =>
    option.setName('ping')
      .setDescription('Rola do pingowania (opcjonalne)')
      .setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

// helper that creates and sends survey
async function createSurvey(channel, authorTag, authorAvatar, pytanie, opcje, pingRole) {
  // build embed with improved styling
  const embed = new EmbedBuilder()
    .setAuthor({ name: authorTag, iconURL: authorAvatar })
    .setTitle('📊 Ankieta')
    .setDescription(pytanie)
    .setColor('#5865F2')
    .setFooter({ text: `Odpowiedzi:`, iconURL: channel.client.user.displayAvatarURL() })
    .setTimestamp();

  opcje.forEach((opt, i) => {
    embed.addFields({ name: `${numberEmojis[i]} Opcja ${i + 1}`, value: opt, inline: false });
  });

  const content = pingRole ? `${pingRole}` : '';
  const message = await channel.send({ content, embeds: [embed] });
  for (let i = 0; i < opcje.length; i++) {
    await message.react(numberEmojis[i]);
  }
}

export async function execute(interaction) {
  // defer quickly to avoid Discord "interaction failed" timeout
  await interaction.deferReply({ ephemeral: true });

  const pytanie = interaction.options.getString('pytanie');
  const opcjeRaw = interaction.options.getString('opcje');
  const pingRole = interaction.options.getRole('ping');

  // split options by comma and trim whitespace
  const opcje = opcjeRaw.split(',').map(o => o.trim()).filter(o => o.length > 0);

  if (opcje.length < 2) {
    return interaction.reply({ content: '❌ Podaj co najmniej dwie opcje oddzielone przecinkami.', ephemeral: true });
  }

  if (opcje.length > numberEmojis.length) {
    return interaction.reply({ content: `❌ Maksymalna liczba opcji to ${numberEmojis.length}.`, ephemeral: true });
  }

  try {
    await createSurvey(
      interaction.channel,
      interaction.user.tag,
      interaction.user.displayAvatarURL(),
      pytanie,
      opcje,
      pingRole
    );
    // edit initial deferred reply with confirmation
    return interaction.editReply({ content: '✅ Ankieta została utworzona!' });
  } catch (err) {
    console.error('Błąd przy tworzeniu ankiety:', err);
    return interaction.reply({ content: '❌ Nie udało się utworzyć ankiety.', ephemeral: true });
  }
}

// prefix-based version for backward compatibility
export async function executePrefix(message, args) {
  const joined = args.join(' ');
  const parts = joined.split('|');
  if (parts.length < 2) {
    return message.reply('❌ Użycie: `,ankieta pytanie | opcja1, opcja2[, opcjaN] | @rolaOpcjonalna`');
  }

  const pytanie = parts[0].trim();
  // opcje+pingRole may be spread across remaining parts
  let opcjeRaw = parts[1].trim();
  let pingRoleMention = null;

  if (parts.length > 2) {
    // treat last segment as role if it contains a mention
    const last = parts[parts.length - 1].trim();
    if (/<@&?\d+>/.test(last)) {
      pingRoleMention = last;
      // recombine options excluding the last part
      opcjeRaw = parts.slice(1, -1).join('|').trim();
    } else {
      opcjeRaw = parts.slice(1).join('|').trim();
    }
  }

  const opcje = opcjeRaw.split(',').map(o => o.trim()).filter(o => o.length > 0);

  if (opcje.length < 2) {
    return message.reply('❌ Podaj co najmniej dwie opcje oddzielone przecinkami.');
  }

  if (opcje.length > numberEmojis.length) {
    return message.reply(`❌ Maksymalna liczba opcji to ${numberEmojis.length}.`);
  }

  try {
    await createSurvey(
      message.channel,
      message.author.tag,
      message.author.displayAvatarURL(),
      pytanie,
      opcje,
      pingRoleMention
    );
    return message.reply('✅ Ankieta została utworzona!');
  } catch (err) {
    console.error('Błąd przy tworzeniu ankiety prefixowej:', err);
    return message.reply('❌ Nie udało się utworzyć ankiety.');
  }
}
