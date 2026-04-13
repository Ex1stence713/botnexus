import { EmbedBuilder } from 'discord.js';

export const name = 'server';
export const description = 'Wyświetla informacje o serwerze';

export async function execute(message, args) {
    if (!message.guild) {
        return message.reply('Ta komenda działa tylko na serwerze!');
    }

    const guild = message.guild;
    const owner = await guild.fetchOwner();
    
    const embed = new EmbedBuilder()
        .setTitle(`🏰 ${guild.name}`)
        .setColor(0x5865F2)
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .addFields(
            { name: '👑 Właściciel', value: owner.user.tag, inline: true },
            { name: '🆔 ID', value: guild.id, inline: true },
            { name: '📅 Utworzony', value: `<t:${Math.floor(guild.createdTimestamp / 1000):R}>`, inline: true }
        )
        .addFields(
            { name: '👥 Członkowie', value: guild.memberCount.toLocaleString(), inline: true },
            { name: '💬 Kanały', value: guild.channels.cache.size.toString(), inline: true },
            { name: '🎭 Role', value: guild.roles.cache.size.toString(), inline: true }
        )
        .addFields(
            { name: '📛 Nazwa', value: guild.name, inline: true },
            { name: '🖼️ Ikona', value: guild.iconURL() ? '[Ikona]()' : 'Brak', inline: true }
        )
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
}