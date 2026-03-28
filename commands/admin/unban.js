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
        
        const reason = args.slice(1).join(' ') || `Odbanowany przez ${message.author.tag}`;
        
        await guild.members.unban(userId, reason);
        
        const embed = new EmbedBuilder()
            .setDescription(`🔓 Odbanowano użytkownika **${bannedUser.user.tag}**\nPowód: ${reason}`)
            .setColor(0x57F287);
        await message.reply({ embeds: [embed] });
    } catch (err) {
        const embed = new EmbedBuilder()
            .setDescription(`❌ Błąd: ${err.message}`)
            .setColor(0xED4245);
        await message.reply({ embeds: [embed] });
    }
}
