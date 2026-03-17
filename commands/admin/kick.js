import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export const name = 'kick';
export const description = 'Wyrzuca użytkownika z serwera';

export async function execute(message, args) {
    const { guild, member } = message;

    if (!guild) return message.reply('Ta komenda działa tylko na serwerze.');

    if (!member?.permissions.has(PermissionFlagsBits.KickMembers)) {
        return message.reply('Nie masz uprawnień do wyrzucania użytkowników.');
    }

    if (args.length === 0) {
        return message.reply('Podaj użytkownika! Użycie: !kick <@użytkownik> [powód]');
    }
    
    const userId = args[0].replace(/<@!?/g, '').replace(/>/g, '');
    const target = await guild.members.fetch(userId).catch(() => null);
    
    if (!target) {
        return message.reply('Nie znaleziono użytkownika na serwerze.');
    }

    if (target.id === member.id) {
        return message.reply('Nie możesz wykonać tej akcji na sobie.');
    }

    if (!guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
        return message.reply('Bot nie ma uprawnień do wyrzucania użytkowników.');
    }

    if (!target.kickable) {
        return message.reply('Nie mogę wyrzucić tego użytkownika (zbyt wysoka rola?).');
    }

    const reason = args.slice(1).join(' ') || 'Brak powodu';
    
    try {
        await target.kick(reason);
        const embed = new EmbedBuilder()
            .setDescription(`Wyrzucono użytkownika **${target.user.tag}**. Powód: ${reason}`)
            .setColor(0x57F287);
        await message.reply({ embeds: [embed] });
    } catch (err) {
        const embed = new EmbedBuilder()
            .setDescription(`❌ Błąd: ${err.message}`)
            .setColor(0xED4245);
        await message.reply({ embeds: [embed] });
    }
}
