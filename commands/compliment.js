import { EmbedBuilder } from 'discord.js';

export const name = 'compliment';
export const description = 'Komplementuje użytkownika';

export async function execute(message, args) {
    let target = message.author;
    
    if (args.length > 0) {
        const userId = args[0].replace(/<@!?/g, '').replace(/>/g, '');
        try {
            target = await message.client.users.fetch(userId);
        } catch (e) {
            return message.reply('Nie znaleziono użytkownika!');
        }
    }
    
    const compliments = [
        `${target.username}, masz niesamowity uśmiech! 😊`,
        `Jesteś jedną z najbardziej inspirujących osób, jakie znam, ${target.username}! ✨`,
        `${target.username}, twoja dobroć jest zaraźliwa! 💖`,
        `Masz talent do sprawiania, że ludzie czują się wyjątkowi, ${target.username}! 🌟`,
        `${target.username}, twoja pozytywna energia rozświetla każde pomieszczenie! ☀️`,
        `Jesteś niesamowicie utalentowany/a, ${target.username}! 🎨`,
        `${target.username}, twoja inteligencja jest imponująca! 🧠`,
        `Masz wspaniałe serce, ${target.username}! 💗`,
        `${target.username}, jesteś prawdziwym przyjacielem! 🤝`,
        `Twoja kreatywność nie zna granic, ${target.username}! 🚀`,
        `${target.username}, jesteś wzorem do naśladowania! 👑`,
        `Masz niesamowitą umiejętność rozwiązywania problemów, ${target.username}! 💡`,
        `${target.username}, twoja determinacja jest godna podziwu! 💪`,
        `Jesteś jednym z najmilszych ludzi, jakich znam, ${target.username}! 🌸`,
        `${target.username}, twoja obecność sprawia, że świat jest lepszy! 🌍`
    ];
    
    const randomCompliment = compliments[Math.floor(Math.random() * compliments.length)];
    
    const embed = new EmbedBuilder()
        .setTitle('💖 Komplement!')
        .setColor(0xFF69B4)
        .setDescription(randomCompliment)
        .addFields(
            { name: '🎁 Dla', value: target.username, inline: true },
            { name: '💝 Od', value: message.author.username, inline: true }
        )
        .setFooter({ text: 'BotNexus • Miłe słowo' })
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}
