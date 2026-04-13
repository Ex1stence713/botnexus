import { EmbedBuilder } from 'discord.js';

export const name = 'kill';
export const description = 'Zabij kogoś (tylko żart)';

const killGifs = [
    'https://media.giphy.com/media/3o6ozDeFc1ujdUObVu/giphy.gif',
    'https://media.giphy.com/media/L4mKjGZhCXqV2/giphy.gif',
    'https://media.giphy.com/media/l0HlPymJpD3CYjP32/giphy.gif'
];

export async function execute(message, args) {
    if (args.length === 0) {
        return message.reply('Podaj użytkownika! Użycie: !kill <@użytkownik>');
    }
    
    const userId = args[0].replace(/<@!?/g, '').replace(/>/g, '');
    let targetUser;
    
    try {
        targetUser = await message.client.users.fetch(userId);
    } catch {
        return message.reply('Nie znaleziono użytkownika!');
    }

    const randomGif = killGifs[Math.floor(Math.random() * killGifs.length)];
    
    const embed = new EmbedBuilder()
        .setTitle('💀 Eliminacja!')
        .setColor(0xED4245)
        .setDescription(`${targetUser} został wyeliminowany przez ${message.author}!`)
        .setImage(randomGif)
        .setFooter({ text: 'BotNexus • Tylko żart!' })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
}