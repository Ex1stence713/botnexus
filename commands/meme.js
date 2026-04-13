import { EmbedBuilder } from 'discord.js';

export const name = 'meme';
export const description = 'Wyświetla losowy meme';

export async function execute(message, args) {
    const subreddits = ['memes', 'dankmemes', 'me_irl', 'meme', 'polandball'];
    const subreddit = subreddits[Math.floor(Math.random() * subreddits.length)];
    
    try {
        const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=30`, {
            headers: { 'User-Agent': 'BotNexus/1.0' }
        });
        const data = await response.json();
        
        const posts = data.data.children
            .filter(post => post.data.post_hint === 'image' && !post.data.is_video)
            .map(post => ({
                title: post.data.title,
                url: post.data.url,
                author: post.data.author,
                upvotes: post.data.ups
            }));
        
        if (posts.length === 0) {
            return message.reply('Nie udało się pobrać mema. Spróbuj ponownie!');
        }
        
        const randomPost = posts[Math.floor(Math.random() * posts.length)];
        
        const embed = new EmbedBuilder()
            .setTitle('😂 Losowy Meme')
            .setColor(0x5865F2)
            .setDescription(randomPost.title)
            .setImage(randomPost.url)
            .addFields(
                { name: '👤 Autor', value: randomPost.author, inline: true },
                { name: '⬆️ Głosy', value: randomPost.upvotes.toLocaleString(), inline: true },
                { name: '📁 Źródło', value: `r/${subreddit}`, inline: true }
            )
            .setFooter({ text: 'BotNexus' })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    } catch (err) {
        const embed = new EmbedBuilder()
            .setTitle('😂 Losowy Meme')
            .setColor(0x5865F2)
            .setDescription('Oto losowy meme dla Ciebie!')
            .setImage('https://i.imgflip.com/1g8my4.jpg')
            .setFooter({ text: 'BotNexus' })
            .setTimestamp();
            
        await message.reply({ embeds: [embed] });
    }
}