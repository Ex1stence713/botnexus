import { EmbedBuilder } from 'discord.js';

export const name = 'sad';
export const description = 'Losowy obrazek smutnego kota';

const sadCatImages = [
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500',
    'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=500',
    'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=500',
    'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=500'
];

export async function execute(message, args) {
    const randomImage = sadCatImages[Math.floor(Math.random() * sadCatImages.length)];
    
    const embed = new EmbedBuilder()
        .setTitle('😿 Smutny kotek')
        .setColor(0x5865F2)
        .setDescription('Trzymaj się... wszystko będzie ok. 💙')
        .setImage(randomImage)
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
}