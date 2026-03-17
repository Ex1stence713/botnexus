import { EmbedBuilder } from 'discord.js';

export const name = 'roleinfo';
export const description = 'Wyświetla informacje o roli';

export async function execute(message, args) {
    if (!message.guild) {
        return message.reply('Ta komenda działa tylko na serwerze!');
    }
    
    if (args.length === 0) {
        return message.reply('Podaj nazwę roli! Użycie: !roleinfo <rola>');
    }
    
    // Pobierz rolę z args (jako nazwę lub mention)
    const roleName = args.join(' ').replace(/<@&/g, '').replace(/>/g, '');
    const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase()) 
              || message.guild.roles.cache.get(roleName);
    
    if (!role) {
        return message.reply('Nie znaleziono takiej roli!');
    }
    
    const roleInfoEmbed = new EmbedBuilder()
        .setTitle(`📋 Informacje o roli: ${role.name}`)
        .setColor(role.color || 0x000000)
        .addFields(
            { name: '🆔 ID roli', value: role.id, inline: true },
            { name: '🎨 Kolor', value: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : 'Brak', inline: true },
            { name: '👥 Liczba członków', value: `${role.members.size}`, inline: true },
            { name: '📅 Utworzona', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:D>`, inline: true },
            { name: '🏷️ Mentionable', value: role.mentionable ? 'Tak' : 'Nie', inline: true },
            { name: '🔒 Managed', value: role.managed ? 'Tak' : 'Nie', inline: true }
        )
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();

    await message.reply({ embeds: [roleInfoEmbed] });
}
