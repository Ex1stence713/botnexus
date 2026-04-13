import { EmbedBuilder } from 'discord.js';

export const name = 'bonk';
export const description = 'BONK! (hit z rurką)';

const bonkImages = [
    'https://media.giphy.com/media/3o7527pa7qs9kCG78A/giphy.gif',
    'https://media.giphy.com/media/J0WtGJ3z5fG3mvoYhR/giphy.gif',
    'https://media.giphy.com/media/l378AEZceMwWboAQE/giphy.gif'
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
    
    const randomImage = bonkImages[Math.floor(Math.random() * bonkImages.length)];
    
    const embed = new EmbedBuilder()
        .setTitle('🔨 BONK!')
        .setColor(0x5865F2)
        .setDescription(targetUser 
            ? `${message.author} robi BONK do ${targetUser}! 💀`
            : `${message.author} robi BONK na sobie! 💀`)
        .setImage(randomImage)
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
}