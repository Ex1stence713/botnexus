import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export const name = 'ban';
export const description = 'Banuje użytkownika';

export async function execute(message, args) {
    const { guild, member } = message;

    if (!guild) return message.reply('Ta komenda działa tylko na serwerze.');

    if (!member?.permissions.has(PermissionFlagsBits.BanMembers)) {
        return message.reply('Nie masz uprawnień do banowania użytkowników.');
    }

    if (args.length === 0) {
        return message.reply('Podaj użytkownika! Użycie: !ban <@użytkownik> [powód]');
    }
    
    const userId = args[0].replace(/<@!?/g, '').replace(/>/g, '');
    const target = await guild.members.fetch(userId).catch(() => null);
    
    if (!target) {
        return message.reply('Nie znaleziono użytkownika na serwerze.');
    }

    if (target.id === member.id) {
        return message.reply('Nie możesz wykonać tej akcji na sobie.');
    }

    if (!guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
        return message.reply('Bot nie ma uprawnień do banowania użytkowników.');
    }

    if (!target.bannable) {
        return message.reply('Nie mogę zbanować tego użytkownika (zbyt wysoka rola?).');
    }

    const reason = args.slice(1).join(' ') || 'Brak powodu';
    
    try {
        await target.ban({ reason: reason });
        const embed = new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle('🔨 Użytkownik zbanowany')
            .addFields(
                { name: '👤 Użytkownik', value: target.user.tag, inline: true },
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
