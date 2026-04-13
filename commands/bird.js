import { EmbedBuilder } from 'discord.js';

export const name = 'bird';
export const description = 'Wyświetla losowe zdjęcie ptaka';

export async function execute(message, args) {
    const birds = [
        'https://images.unsplash.com/photo-1552728089-57bdde30beb3',
        'https://images.unsplash.com/photo-1444464666168-49d633b86797',
        'https://images.unsplash.com/photo-1470114716159-e389f8712fda',
        'https://images.unsplash.com/photo-1480044965905-02098d419e96',
        'https://images.unsplash.com/photo-1544923246-77307dd628b7'
    ];
    
    const randomBird = birds[Math.floor(Math.random() * birds.length)] + '?w=500';
    
    const embed = new EmbedBuilder()
        .setTitle('🐦 Losowy ptak!')
        .setColor(0x5865F2)
        .setImage(randomBird)
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
}