import { EmbedBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';

export const name = 'slowmode';
export const description = 'Ustawia slowmode na kanale';

export async function execute(message, args) {
    const { guild, member, channel } = message;

    if (!guild) return message.reply('Ta komenda działa tylko na serwerze.');

    if (!member?.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return message.reply('Nie masz uprawnień do zarządzania kanałami.');
    }

    if (channel.type !== ChannelType.GuildText) {
        return message.reply('Ta komenda działa tylko na kanałach tekstowych!');
    }

    if (args.length === 0) {
        return message.reply('Podaj czas w sekundach! Użycie: !slowmode <sekundy> (0 aby wyłączyć)');
    }
    
    const seconds = parseInt(args[0]);
    
    if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
        return message.reply('Podaj poprawny czas (0-21600 sekund)!');
    }
    
    try {
        await channel.setRateLimitPerUser(seconds);
        
        let title;
        if (seconds === 0) {
            title = '⚡ Slowmode wyłączony';
        } else {
            title = '🐌 Slowmode włączony';
        }
        
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(title)
            .addFields(
                { name: '📛 Kanał', value: channel.name, inline: true },
                { name: '⏱️ Czas', value: seconds === 0 ? 'Wyłączony' : `${seconds} sekund`, inline: true },
                { name: '🛡️ Moderator', value: message.author.tag, inline: true }
            )
            .setFooter({ text: 'BotNexus' })
            .setTimestamp();
        await message.reply({ embeds: [embed] });
    } catch (err) {
        const embed = new EmbedBuilder()
            .setColor(0xED4245)
            .setDescription(`❌ Błąd: ${err.message}`);
        await message.reply({ embeds: [embed] });
    }
}
