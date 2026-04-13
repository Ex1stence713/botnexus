import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export const name = 'unban';
export const description = 'Odbanowuje użytkownika';

export async function execute(message, args) {
    const { guild, member } = message;

    if (!guild) return message.reply('Ta komenda działa tylko na serwerze.');

    if (!member?.permissions.has(PermissionFlagsBits.BanMembers)) {
        return message.reply('Nie masz uprawnień do odbanowywania użytkowników.');
    }

    if (args.length === 0) {
        return message.reply('Podaj ID użytkownika! Użycie: !unban <ID użytkownika> [powód]');
    }
    
    const userId = args[0];
    
    try {
        const bans = await guild.bans.fetch();
        const bannedUser = bans.get(userId);
        
        if (!bannedUser) {
            return message.reply('Ten użytkownik nie jest zbanowany!');
        }
        
        const reason = args.slice(1).join(' ') || 'Brak powodu';
        
        await guild.members.unban(userId, reason);
        
        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('🔓 Użytkownik odbanowany')
            .addFields(
                { name: '👤 Użytkownik', value: bannedUser.user.tag, inline: true },
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
