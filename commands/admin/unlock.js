import { EmbedBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';

export const name = 'unlock';
export const description = 'Odblokowuje kanał tekstowy';

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
            SendMessages: null
        });
        
        const reason = args.join(' ') || 'Brak powodu';
        
        const embed = new EmbedBuilder()
            .setDescription(`🔓 Kanał ${channel} został odblokowany\nPowód: ${reason}`)
            .setColor(0x57F287);
        await message.reply({ embeds: [embed] });
    } catch (err) {
        const embed = new EmbedBuilder()
            .setDescription(`❌ Błąd: ${err.message}`)
            .setColor(0xED4245);
        await message.reply({ embeds: [embed] });
    }
}
