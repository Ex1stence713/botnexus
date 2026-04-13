import { EmbedBuilder } from 'discord.js';

export const name = 'hug';
export const description = 'Wysyła przytaszczący gif';

const hugGifs = [
    'https://media.giphy.com/media/odMfLPM6YozBVu8nC3/giphy.gif',
    'https://media.giphy.com/media/l4FGuhL4U2WyjdkaY/giphy.gif',
    'https://media.giphy.com/media/3o6ozvv0zsJskzOCbu/giphy.gif',
    'https://media.giphy.com/media/uC4fjZfj4L13mV6rfX/giphy.gif',
    'https://media.giphy.com/media/109ltG02WNaBQ/giphy.gif'
];

export async function execute(message, args) {
    let targetUser = null;
    let hugText = '';
    
    if (args.length > 0) {
        const userId = args[0].replace(/<@!?/g, '').replace(/>/g, '');
        try {
            targetUser = await message.client.users.fetch(userId);
            hugText = ` ${targetUser}!`;
        } catch {
            // Ignore
        }
    }
    
    const randomGif = hugGifs[Math.floor(Math.random() * hugGifs.length)];
    
    const embed = new EmbedBuilder()
        .setTitle('🤗 Przytulas!')
        .setColor(0x5865F2)
        .setDescription(`${message.author} przytula${targetUser ? ` ${targetUser}` : ' siebie'}! 💕`)
        .setImage(randomGif)
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
}