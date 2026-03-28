import { EmbedBuilder } from 'discord.js';

export const name = 'roll';
export const description = 'Rzuca kością (domyślnie 1-100)';

export async function execute(message, args) {
    let min = 1;
    let max = 100;
    
    if (args.length >= 2) {
        min = parseInt(args[0]);
        max = parseInt(args[1]);
        
        if (isNaN(min) || isNaN(max)) {
            return message.reply('Podaj poprawne liczby! Użycie: !roll [min] [max]');
        }
        
        if (min >= max) {
            return message.reply('Minimalna wartość musi być mniejsza od maksymalnej!');
        }
    } else if (args.length === 1) {
        max = parseInt(args[0]);
        
        if (isNaN(max)) {
            return message.reply('Podaj poprawną liczbę! Użycie: !roll [max]');
        }
        
        if (max < 1) {
            return message.reply('Maksymalna wartość musi być większa od 0!');
        }
    }
    
    const result = Math.floor(Math.random() * (max - min + 1)) + min;
    
    const embed = new EmbedBuilder()
        .setTitle('🎲 Rzut kością')
        .setColor('#5865F2')
        .addFields(
            { name: '📊 Zakres', value: `${min} - ${max}`, inline: true },
            { name: '🎯 Wynik', value: `**${result}**`, inline: true }
        )
        .setFooter({ text: `Zapytanie od: ${message.author.tag} • BotNexus` })
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}
