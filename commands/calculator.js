import { EmbedBuilder } from 'discord.js';

export const name = 'calc';
export const description = 'Kalkulator matematyczny';

export async function execute(message, args) {
    if (args.length === 0) {
        return message.reply('Podaj wyrażenie matematyczne! Użycie: !calc <wyrażenie>\nPrzykłady: !calc 2+2, !calc 10*5, !calc 100/4');
    }
    
    const expression = args.join(' ');
    
    // Bezpieczne eval - tylko podstawowe operacje matematyczne
    const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, '');
    
    if (sanitized !== expression) {
        return message.reply('Nieprawidłowe wyrażenie! Dozwolone tylko cyfry i operatory: + - * / ( ) %');
    }
    
    try {
        // Użyj Function zamiast eval dla bezpieczeństwa
        const result = new Function('return ' + sanitized)();
        
        if (isNaN(result) || !isFinite(result)) {
            return message.reply('Nie można obliczyć tego wyrażenia!');
        }
        
        const embed = new EmbedBuilder()
            .setTitle('🧮 Kalkulator')
            .setColor(0x5865F2)
            .addFields(
                { name: '📝 Wyrażenie', value: `\`${expression}\``, inline: false },
                { name: '✅ Wynik', value: `**${result}**`, inline: false }
            )
            .setFooter({ text: `Zapytanie od: ${message.author.tag} • BotNexus` })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    } catch (err) {
        const embed = new EmbedBuilder()
            .setDescription('❌ Nieprawidłowe wyrażenie matematyczne!')
            .setColor(0xED4245);
        await message.reply({ embeds: [embed] });
    }
}
