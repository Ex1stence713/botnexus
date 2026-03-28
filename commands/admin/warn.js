import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export const name = 'warn';
export const description = 'Ostrzega użytkownika';

export async function execute(message, args) {
    const { guild, member } = message;

    if (!guild) return message.reply('Ta komenda działa tylko na serwerze.');

    if (!member?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return message.reply('Nie masz uprawnień do ostrzegania użytkowników.');
    }

    if (args.length < 2) {
        return message.reply('Podaj użytkownika i powód! Użycie: !warn <@użytkownik> <powód>');
    }
    
    const userId = args[0].replace(/<@!?/g, '').replace(/>/g, '');
    const target = await guild.members.fetch(userId).catch(() => null);
    
    if (!target) {
        return message.reply('Nie znaleziono użytkownika na serwerze.');
    }

    if (target.id === member.id) {
        return message.reply('Nie możesz ostrzec siebie.');
    }

    if (!target.moderatable) {
        return message.reply('Nie mogę ostrzec tego użytkownika (zbyt wysoka rola?).');
    }

    const reason = args.slice(1).join(' ');
    
    try {
        const embed = new EmbedBuilder()
            .setDescription(`⚠️ Ostrzeżono użytkownika **${target.user.tag}**\nPowód: ${reason}`)
            .setColor(0xFEE75C);
        await message.reply({ embeds: [embed] });
        
        // Wyślij DM do użytkownika
        const dmEmbed = new EmbedBuilder()
            .setTitle('⚠️ Zostałeś ostrzeżony')
            .setDescription(`Zostałeś ostrzeżony na serwerze **${guild.name}**`)
            .addFields(
                { name: 'Powód', value: reason, inline: false },
                { name: 'Moderator', value: message.author.tag, inline: false }
            )
            .setColor(0xFEE75C)
            .setTimestamp();
        
        await target.send({ embeds: [dmEmbed] }).catch(() => {});
    } catch (err) {
        const embed = new EmbedBuilder()
            .setDescription(`❌ Błąd: ${err.message}`)
            .setColor(0xED4245);
        await message.reply({ embeds: [embed] });
    }
}
