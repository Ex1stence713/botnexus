import { EmbedBuilder } from 'discord.js';

export const name = 'userinfo';
export const description = 'Wyświetla szczegółowe informacje o użytkowniku';

export async function execute(message, args) {
    // Pobierz użytkownika z args lub użyj autora wiadomości
    let user = message.author;
    
    if (args.length > 0) {
        // Próba pobrania użytkownika z mention lub ID
        const userId = args[0].replace(/<@!/g, '').replace(/<@/g, '').replace(/>/g, '');
        try {
            user = await message.client.users.fetch(userId);
        } catch (e) {
            return message.reply('Nie znaleziono użytkownika!');
        }
    }
    
    // Próba pobrania członka serwera (może być null jeśli użytkownik nie jest na serwerze)
    let member = null;
    if (message.guild) {
        try {
            member = await message.guild.members.fetch(user.id).catch(() => null);
        } catch (e) {
            member = null;
        }
    }

    const embed = new EmbedBuilder()
        .setTitle(`Informacje o ${user.username}`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setColor('#5865F2')
        .addFields(
            { name: '🆔 ID', value: user.id, inline: true },
            { name: '📅 Konto założono', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
            { name: '📥 Dołączył na serwer', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Brak danych', inline: true },
            { name: '👑 Najwyższa rola', value: member ? `${member.roles.highest}` : 'Brak', inline: true }
        )
        .setFooter({ text: `Zapytanie od: ${message.author.tag}` });

    await message.reply({ embeds: [embed] });
}
