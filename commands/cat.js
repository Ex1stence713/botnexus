import { EmbedBuilder } from 'discord.js';

export const name = 'cat';
export const description = 'Wyświetla losowe zdjęcie kota';

export async function execute(message, args) {
    const embed = new EmbedBuilder()
        .setTitle('🐱 Losowy kot!')
        .setColor(0x5865F2)
        .setImage('https://cataas.com/cat?random=' + Date.now())
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
}