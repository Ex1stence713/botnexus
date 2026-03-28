import { EmbedBuilder } from 'discord.js';

export const name = 'rate';
export const description = 'Ocenia coś w skali 1-10';

export async function execute(message, args) {
    if (args.length === 0) {
        return message.reply('Podaj co chcesz ocenić! Użycie: !rate <coś>');
    }
    
    const thing = args.join(' ');
    
    // Generuj "losową" ocenę na podstawie tekstu
    const hash = thing.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);
    
    const rating = Math.abs(hash % 10) + 1;
    
    let emoji, comment, color;
    if (rating === 10) {
        emoji = '🏆';
        comment = 'Perfekcja! Nie ma lepszego!';
        color = 0xFFD700;
    } else if (rating >= 8) {
        emoji = '⭐';
        comment = 'Świetne! Bardzo wysoko!';
        color = 0x00FF00;
    } else if (rating >= 6) {
        emoji = '👍';
        comment = 'Dobre, ale może być lepiej!';
        color = 0x00BFFF;
    } else if (rating >= 4) {
        emoji = '😐';
        comment = 'Przeciętne...';
        color = 0xFFFF00;
    } else if (rating >= 2) {
        emoji = '👎';
        comment = 'Słabe...';
        color = 0xFFA500;
    } else {
        emoji = '💀';
        comment = 'Katastrofa!';
        color = 0xFF0000;
    }
    
    // Generuj pasek oceny
    const barLength = 10;
    const filledBars = Math.round((rating / 10) * barLength);
    const bar = '█'.repeat(filledBars) + '░'.repeat(barLength - filledBars);
    
    const embed = new EmbedBuilder()
        .setTitle(`${emoji} Ocena`)
        .setColor(color)
        .addFields(
            { name: '📝 Oceniam', value: thing, inline: false },
            { name: '⭐ Ocena', value: `**${rating}/10** ${bar}`, inline: false },
            { name: '💬 Komentarz', value: comment, inline: false }
        )
        .setFooter({ text: `Zapytanie od: ${message.author.tag} • BotNexus` })
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}
