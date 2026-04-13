import { EmbedBuilder } from 'discord.js';

export const name = 'slap';
export const description = 'Złapiesz użytkownika';

const slapGifs = [
    'https://media.giphy.com/media/3o6ozkRnrXvfvgkAJm/giphy.gif',
    'https://media.giphy.com/media/Zw3oBUuOlDJ3W/giphy.gif',
    'https://media.giphy.com/media/l3fQf1OEAq0iri9RC/giphy.gif'
];

export async function execute(message, args) {
    if (args.length === 0) {
        return message.reply('Podaj użytkownika! Użycie: !slap <@użytkownik>');
    }
    
    const userId = args[0].replace(/<@!?/g, '').replace(/>/g, '');
    let targetUser;
    
    try {
        targetUser = await message.client.users.fetch(userId);
    } catch {
        return message.reply('Nie znaleziono użytkownika!');
    }
    
    const randomGif = slapGifs[Math.floor(Math.random() * slapGifs.length)];
    
    const embed = new EmbedBuilder()
        .setTitle('💢 SLAP!')
        .setColor(0xED4245)
        .setDescription(`${message.author} zalizował(a) ${targetUser}! 💫`)
        .setImage(randomGif)
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
}