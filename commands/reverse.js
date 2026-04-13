import { EmbedBuilder } from 'discord.js';

export const name = 'reverse';
export const description = 'Odwraca podany tekst';

export async function execute(message, args) {
    if (args.length === 0) {
        return message.reply('Podaj tekst! Użycie: !reverse <tekst>');
    }
    
    const text = args.join(' ');
    const reversed = text.split('').reverse().join('');
    
    const embed = new EmbedBuilder()
        .setTitle('🔄 Odwrócony tekst')
        .setColor(0x5865F2)
        .addFields(
            { name: '📝 Oryginał', value: text, inline: false },
            { name: '🔃 Odwrócony', value: reversed, inline: false }
        )
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
}