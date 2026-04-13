import { EmbedBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';

export const name = 'lock';
export const description = 'Blokuje kanał tekstowy';

export async function execute(message, args) {
    const { guild, member, channel } = message;

    if (!guild) return message.reply('Ta komenda działa tylko na serwerze.');

    if (!member?.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return message.reply('Nie masz uprawnień do zarządzania kanałami.');
    }

    if (channel.type !== ChannelType.GuildText) {
        return message.reply('Ta komenda działa tylko na kanałach tekstowych!');
    }
    
    try {
        await channel.permissionOverwrites.edit(guild.roles.everyone, {
            SendMessages: false
        });
        
        const reason = args.join(' ') || 'Brak powodu';
        
        const embed = new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle('🔒 Kanał zablokowany')
            .addFields(
                { name: '📛 Kanał', value: channel.name, inline: true },
                { name: '📝 Powód', value: reason, inline: true },
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
