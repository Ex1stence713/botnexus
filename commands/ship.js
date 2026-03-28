import { EmbedBuilder } from 'discord.js';

export const name = 'ship';
export const description = 'Oblicza kompatybilność między dwoma użytkownikami';

export async function execute(message, args) {
    if (args.length < 2) {
        return message.reply('Podaj dwóch użytkowników! Użycie: !ship <@użytkownik1> <@użytkownik2>');
    }
    
    const userId1 = args[0].replace(/<@!?/g, '').replace(/>/g, '');
    const userId2 = args[1].replace(/<@!?/g, '').replace(/>/g, '');
    
    let user1, user2;
    
    try {
        user1 = await message.client.users.fetch(userId1);
        user2 = await message.client.users.fetch(userId2);
    } catch (e) {
        return message.reply('Nie znaleziono jednego z użytkowników!');
    }
    
    // Generuj "losową" kompatybilność na podstawie ID użytkowników
    const hash = (userId1 + userId2).split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);
    
    const compatibility = Math.abs(hash % 101);
    
    let status, emoji, color;
    if (compatibility >= 90) {
        status = 'Idealna para! 💕';
        emoji = '💖';
        color = 0xFF69B4;
    } else if (compatibility >= 70) {
        status = 'Świetna para! 💗';
        emoji = '💗';
        color = 0xFF1493;
    } else if (compatibility >= 50) {
        status = 'Dobra para! 💛';
        emoji = '💛';
        color = 0xFFD700;
    } else if (compatibility >= 30) {
        status = 'Może być... 💙';
        emoji = '💙';
        color = 0x00BFFF;
    } else {
        status = 'Przyjaciele! 💚';
        emoji = '💚';
        color = 0x00FF00;
    }
    
    // Generuj pasek kompatybilności
    const barLength = 10;
    const filledBars = Math.round((compatibility / 100) * barLength);
    const bar = '█'.repeat(filledBars) + '░'.repeat(barLength - filledBars);
    
    const embed = new EmbedBuilder()
        .setTitle(`${emoji} Ship ${user1.username} & ${user2.username}`)
        .setColor(color)
        .addFields(
            { name: '👥 Użytkownicy', value: `${user1.username} ❤️ ${user2.username}`, inline: false },
            { name: '💕 Kompatybilność', value: `**${compatibility}%** ${bar}`, inline: false },
            { name: '📊 Status', value: status, inline: false }
        )
        .setFooter({ text: `Zapytanie od: ${message.author.tag} • BotNexus` })
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}
