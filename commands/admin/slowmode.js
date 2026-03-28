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
        
        let description;
        if (seconds === 0) {
            description = `⚡ Slowmode został wyłączony na kanale ${channel}`;
        } else {
            description = `🐌 Slowmode ustawiony na **${seconds} sekund** na kanale ${channel}`;
        }
        
        const embed = new EmbedBuilder()
            .setDescription(description)
            .setColor(0x5865F2);
        await message.reply({ embeds: [embed] });
    } catch (err) {
        const embed = new EmbedBuilder()
            .setDescription(`❌ Błąd: ${err.message}`)
            .setColor(0xED4245);
        await message.reply({ embeds: [embed] });
    }
}
