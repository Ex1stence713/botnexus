import { EmbedBuilder } from 'discord.js';

export const name = 'dog';
export const description = 'Wyświetla losowe zdjęcie psa';

export async function execute(message, args) {
    const embed = new EmbedBuilder()
        .setTitle('🐕 Losowy pies!')
        .setColor(0x5865F2)
        .setImage('https://dog.ceo/api/img/random')
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
}