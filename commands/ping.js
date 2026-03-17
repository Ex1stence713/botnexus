import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const name = 'ping';
export const description = 'Wyświetla ping bota';

export async function execute(message, args) {
    const client = message.client;
    const sentMessage = await message.reply('🏓 Liczenie pingu...');
    
    const ping = client.ws.ping;
    const messagePing = sentMessage.createdTimestamp - message.createdTimestamp;
    
    let pingStatus = '🟢 Świetny';
    let pingColor = 0x2ecc71;
    
    if (ping >= 200) {
        pingStatus = '🔴 Słaby';
        pingColor = 0xe74c3c;
    } else if (ping >= 100) {
        pingStatus = '🟡 Średni';
        pingColor = 0xf1c40f;
    } else if (ping >= 50) {
        pingStatus = '🟢 Dobry';
        pingColor = 0x2ecc71;
    }
    
    const embed = new EmbedBuilder()
        .setTitle('🏓 Pong!')
        .setColor(pingColor)
        .addFields(
            { name: '🔌 WebSocket Ping', value: '```' + ping + 'ms```', inline: true },
            { name: '💬 Message Ping', value: '```' + messagePing + 'ms```', inline: true }
        )
        .addFields(
            { name: '📊 Status', value: pingStatus, inline: false }
        )
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();

    const pingBars = getPingBars(ping);
    embed.addFields({ name: '📈 Wykres pingu', value: pingBars, inline: false });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('ping_again')
                .setLabel('🔄 Sprawdź ponownie')
                .setStyle(ButtonStyle.Secondary)
        );

    await sentMessage.edit({ embeds: [embed], components: [row] });
}

function getPingBars(ping) {
    const maxBars = 10;
    const filledBars = Math.min(Math.floor((ping / 300) * maxBars), maxBars);
    
    let bars = '';
    for (let i = 0; i < maxBars; i++) {
        if (i < filledBars) {
            if (ping < 100) bars += '🟩';
            else if (ping < 200) bars += '🟨';
            else bars += '🟥';
        } else {
            bars += '⬛';
        }
    }
    
    return bars + ' (' + ping + 'ms)';
}
