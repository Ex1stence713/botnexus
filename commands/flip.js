import { EmbedBuilder } from 'discord.js';

export const name = 'flip';
export const description = 'Rzuca monetą';

export async function execute(message, args) {
    const result = Math.random() < 0.5 ? 'Orzeł' : 'Reszka';
    const emoji = result === 'Orzeł' ? '🦅' : '🪙';
    
    const embed = new EmbedBuilder()
        .setTitle('🪙 Rzut monetą')
        .setColor(0x5865F2)
        .addFields(
            { name: '🎯 Wynik', value: `${emoji} **${result}**`, inline: false }
        )
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}
