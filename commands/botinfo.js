import { EmbedBuilder } from 'discord.js';

export const name = 'botinfo';
export const description = 'Wyświetla informacje o bocie';

export async function execute(message, args) {
    const client = message.client;
    
    const botInfoEmbed = new EmbedBuilder()
        .setTitle('🤖 Informacje o Bocie')
        .setColor(0x5865F2)
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '📛 Nazwa bota', value: client.user.username, inline: true },
            { name: '🆔 ID bota', value: client.user.id, inline: true },
            { name: '📅 Utworzony', value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:D>`, inline: true },
            { name: '⏱️ Ping', value: `${Math.round(client.ws.ping)}ms`, inline: true },
            { name: '🏢 Serwery', value: `${client.guilds.cache.size}`, inline: true },
            { name: '👥 Użytkownicy', value: `${client.users.cache.size}`, inline: true }
        )
        .setFooter({ text: 'BotNexus • Wersja 1.0' })
        .setTimestamp();

    await message.reply({ embeds: [botInfoEmbed] });
}
