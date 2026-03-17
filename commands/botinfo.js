import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const name = 'botinfo';
export const description = 'Wyświetla informacje o bocie';

export async function execute(message, args) {
    const client = message.client;
    
    const ping = client.ws.ping;
    let pingColor = '#2ecc71';
    let pingEmoji = '🟢';
    
    if (ping >= 200) {
        pingColor = '#e74c3c';
        pingEmoji = '🔴';
    } else if (ping >= 100) {
        pingColor = '#f1c40f';
        pingEmoji = '🟡';
    }
    
    const botInfoEmbed = new EmbedBuilder()
        .setTitle('🤖 Informacje o Bocie')
        .setColor(0x5865F2)
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setDescription('**Nexus Bot** - Twój wielofunkcyjny bot Discord!')
        .addFields(
            { name: '📛 Nazwa bota', value: client.user.username, inline: true },
            { name: '🆔 ID bota', value: client.user.id, inline: true },
            { name: '📅 Utworzony', value: '<t:' + Math.floor(client.user.createdTimestamp / 1000) + ':D>', inline: true }
        )
        .addFields(
            { name: '─────────────────', value: '**📊 Statystyki:**', inline: false },
            { name: pingEmoji + ' Ping', value: ping + 'ms', inline: true },
            { name: '🏢 Serwery', value: String(client.guilds.cache.size), inline: true },
            { name: '👥 Użytkownicy', value: String(client.users.cache.size), inline: true },
            { name: '💬 Kanały', value: String(client.channels.cache.size), inline: true }
        )
        .addFields(
            { name: '─────────────────', value: '**⚙️ Informacje techniczne:**', inline: false },
            { name: '📦 Wersja', value: '1.0.0', inline: true },
            { name: '🧩 Discord.js', value: 'v14.x', inline: true },
            { name: '⏱️ Uptime', value: client.uptime ? formatUptime(client.uptime) : 'N/A', inline: true }
        )
        .setFooter({ text: 'BotNexus • Wersja 1.0.0' })
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('bi_support')
                .setLabel('💬 Support')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.gg/p8YGTDyxR8'),
            new ButtonBuilder()
                .setCustomId('bi_invite')
                .setLabel('📥 Invite')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.com/oauth2/authorize')
        );

    await message.reply({ embeds: [botInfoEmbed], components: [row] });
}

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return days + 'd ' + (hours % 24) + 'h';
    if (hours > 0) return hours + 'h ' + (minutes % 60) + 'm';
    return minutes + 'm';
}
