import { EmbedBuilder } from 'discord.js';

export const name = 'emojilist';
export const description = 'Wyświetla listę emoji na serwerze';

export async function execute(message, args) {
    if (!message.guild) {
        return message.reply('Ta komenda działa tylko na serwerze!');
    }
    
    const guild = message.guild;
    const emojis = guild.emojis.cache;

    if (emojis.size === 0) {
        return message.reply('❌ Na tym serwerze nie ma żadnych emoji!');
    }

    const emojiList = emojis.map(e => `${e} \`${e.name}\``).join('\n');
    
    const chunks = [];
    const chunkSize = 20;
    const emojiArray = emojis.map(e => `${e} \`${e.name}\``);
    
    for (let i = 0; i < emojiArray.length; i += chunkSize) {
        chunks.push(emojiArray.slice(i, i + chunkSize).join('\n'));
    }

    const embed = new EmbedBuilder()
        .setTitle('😀 Lista Emoji Serwera')
        .setDescription(`Łącznie: ${emojis.size} emoji`)
        .setColor(0x5865F2)
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();

    if (chunks.length === 1) {
        embed.addFields({ name: 'Emoji', value: emojiList || 'Brak', inline: false });
        await message.reply({ embeds: [embed] });
    } else {
        await message.reply({ embeds: [embed] });
        
        for (const chunk of chunks) {
            const chunkEmbed = new EmbedBuilder()
                .setColor(0x5865F2)
                .addFields({ name: 'Emoji', value: chunk, inline: false })
                .setFooter({ text: 'BotNexus' })
                .setTimestamp();
            
            await message.channel.send({ embeds: [chunkEmbed] });
        }
    }
}
