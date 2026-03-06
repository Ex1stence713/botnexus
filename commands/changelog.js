import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('changelog')
    .setDescription('Publikuje nowości na serwerze')
    .addStringOption(option =>
        option.setName('tytul')
            .setDescription('Tytuł nowości')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('tresc')
            .setDescription('Treść nowości')
            .setRequired(true))
    .addChannelOption(option =>
        option.setName('kanal')
            .setDescription('Kanał, do którego zostanie wysłana nowość')
            .setRequired(true))
    .addRoleOption(option =>
        option.setName('ping')
            .setDescription('Rola do pingowania (opcjonalne)')
            .setRequired(false))
    .addStringOption(option =>
        option.setName('miniatura')
            .setDescription('Link do miniaturki (opcjonalne)')
            .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction) {
    const tytul = interaction.options.getString('tytul');
    const tresc = interaction.options.getString('tresc');
    const channel = interaction.options.getChannel('kanal');
    const pingRole = interaction.options.getRole('ping');
    const thumbnail = interaction.options.getString('miniatura');

    const embed = new EmbedBuilder()
        .setAuthor({ 
            name: '📢 Ogłoszenie Administracji', 
            iconURL: interaction.guild.iconURL() 
        })
        .setTitle(tytul)
        .setDescription(tresc)
        .setColor('#5865F2')
        .addFields(
            { name: '👤 Opublikowane przez', value: `${interaction.user}`, inline: true },
            { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setFooter({ 
            text: `${interaction.guild.name} • Changelog`, 
            iconURL: interaction.guild.iconURL() 
        })
        .setTimestamp();

    if (thumbnail) {
        embed.setThumbnail(thumbnail);
    }

    if (!channel) {
        return interaction.reply({ content: '❌ Nie znaleziono kanału.', ephemeral: true });
    }

    if (!channel.isTextBased?.()) {
        return interaction.reply({ content: '❌ Wybrany kanał nie pozwala na wysyłanie wiadomości.', ephemeral: true });
    }

    try {
        const messageContent = pingRole ? `${pingRole} 🔔` : '';
        await channel.send({ content: messageContent, embeds: [embed] });
        return interaction.reply({ 
            content: `✅ Wysłano nowość na kanał <#${channel.id}>${pingRole ? ` z pingiem ${pingRole}` : ''}.`, 
            ephemeral: true 
        });
    } catch (err) {
        console.error('Błąd przy wysyłaniu na kanał:', err);
        return interaction.reply({ content: '❌ Nie udało się wysłać wiadomości na wybrany kanał.', ephemeral: true });
    }
}