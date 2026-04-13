import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export const name = 'timeout';
export const description = 'Wycisza użytkownika na określony czas';

export async function execute(message, args) {
    const { guild, member } = message;

    if (!guild) return message.reply('Ta komenda działa tylko na serwerze.');

    if (!member?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return message.reply('Nie masz uprawnień do wyciszania użytkowników.');
    }

    if (args.length < 2) {
        return message.reply('Podaj użytkownika i czas! Użycie: !timeout <@użytkownik> <czas w minutach> [powód]');
    }
    
    const userId = args[0].replace(/<@!?/g, '').replace(/>/g, '');
    const target = await guild.members.fetch(userId).catch(() => null);
    
    if (!target) {
        return message.reply('Nie znaleziono użytkownika na serwerze.');
    }

    if (target.id === member.id) {
        return message.reply('Nie możesz wyciszyć siebie.');
    }

    if (!target.moderatable) {
        return message.reply('Nie mogę wyciszyć tego użytkownika (zbyt wysoka rola?).');
    }

    const duration = parseInt(args[1]);
    if (isNaN(duration) || duration < 1 || duration > 40320) {
        return message.reply('Podaj poprawny czas (1-40320 minut)!');
    }

    const reason = args.slice(2).join(' ') || 'Brak powodu';
    const durationMs = duration * 60 * 1000;
    
    try {
        await target.timeout(durationMs, reason);
        
        const embed = new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle('🔇 Użytkownik wyciszony')
            .addFields(
                { name: '👤 Użytkownik', value: target.user.tag, inline: true },
                { name: '⏱️ Czas', value: `${duration} minut`, inline: true },
                { name: '📝 Powód', value: reason, inline: true },
                { name: '🛡️ Moderator', value: message.author.tag, inline: true }
            )
            .setFooter({ text: 'BotNexus' })
            .setTimestamp();
        await message.reply({ embeds: [embed] });
        
        const dmEmbed = new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle('🔇 Otrzymałeś wyciszenie!')
            .addFields(
                { name: '📛 Serwer', value: guild.name, inline: false },
                { name: '⏱️ Czas', value: `${duration} minut`, inline: false },
                { name: '📝 Powód', value: reason, inline: false },
                { name: '🛡️ Moderator', value: message.author.tag, inline: false }
            )
            .setFooter({ text: 'BotNexus' })
            .setTimestamp();
        
        await target.send({ embeds: [dmEmbed] }).catch(() => {});
    } catch (err) {
        const embed = new EmbedBuilder()
            .setColor(0xED4245)
            .setDescription(`❌ Błąd: ${err.message}`);
        await message.reply({ embeds: [embed] });
    }
}
