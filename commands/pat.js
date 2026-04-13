import { EmbedBuilder } from 'discord.js';

export const name = 'pat';
export const description = 'Głaszcze użytkownika';

const patGifs = [
    'https://media.giphy.com/media/5Yj2p76ksy49W/giphy.gif',
    'https://media.giphy.com/media/109ltG02WNaBQ/giphy.gif',
    'https://media.giphy.com/media/3o6ozqE74C9J0gr9nQ/giphy.gif'
];

export async function execute(message, args) {
    let targetUser = null;
    
    if (args.length > 0) {
        const userId = args[0].replace(/<@!?/g, '').replace(/>/g, '');
        try {
            targetUser = await message.client.users.fetch(userId);
        } catch {
            // Ignore
        }
    }
    
    const randomGif = patGifs[Math.floor(Math.random() * patGifs.length)];
    
    const embed = new EmbedBuilder()
        .setTitle('🐾 Głaskanie!')
        .setColor(0x5865F2)
        .setDescription(targetUser 
            ? `${message.author} głaszcze ${targetUser}! 💕`
            : `${message.author} głaszcze siebie! 💕`)
        .setImage(randomGif)
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
}