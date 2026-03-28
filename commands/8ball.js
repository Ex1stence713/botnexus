import { EmbedBuilder } from 'discord.js';

export const name = '8ball';
export const description = 'Magiczna kula 8 - zadaj pytanie';

export async function execute(message, args) {
    if (args.length === 0) {
        return message.reply('Zadaj pytanie! Użycie: !8ball <pytanie>');
    }
    
    const question = args.join(' ');
    
    const responses = [
        '🟢 Tak, zdecydowanie!',
        '🟢 Tak!',
        '🟢 Oczywiście!',
        '🟢 Z pewnością!',
        '🟡 Może...',
        '🟡 Nie jestem pewien...',
        '🟡 Zapytaj ponownie później',
        '🔴 Nie!',
        '🔴 Zdecydowanie nie!',
        '🔴 Nie sądzę...',
        '🔴 Absolutnie nie!',
        '🔵 Lepiej nie mówić...',
        '🔵 Nie mogę powiedzieć...',
        '🔵 Skup się i zapytaj ponownie'
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    const embed = new EmbedBuilder()
        .setTitle('🎱 Magiczna Kula 8')
        .setColor('#5865F2')
        .addFields(
            { name: '❓ Twoje pytanie', value: question, inline: false },
            { name: '🔮 Odpowiedź', value: randomResponse, inline: false }
        )
        .setFooter({ text: `Zapytanie od: ${message.author.tag} • BotNexus` })
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}
