import { EmbedBuilder } from 'discord.js';

export const name = 'roast';
export const description = 'Roastuje użytkownika';

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
    
    const roasts = [
        `Gdyby ${target.username} był jedzeniem, byłbyś niesmacznym jedzeniem.`,
        `${target.username}, twoje życie jest jak zepsuty zegarek - nawet dwa razy dziennie nie masz racji.`,
        `Nie mówię, że ${target.username} jest głupi, ale gdyby mózg był paliwem, nie wystarczyłoby na przejechanie motorynki.`,
        `${target.username}, jesteś dowodem na to, że ewolucja może iść w tył.`,
        `Gdyby głupota bolała, ${target.username} byłby szpitalem.`,
        `${target.username}, twoja twarz sprawia, że cebula płacze.`,
        `Nie jesteś głupi, ${target.username}. Jesteś po prostu pechowy w myśleniu.`,
        `${target.username}, gdybyś był przyprawą, byłbyś mąką.`,
        `Twoje IQ jest niższe niż temperatura w lodówce, ${target.username}.`,
        `${target.username}, jesteś jak chmura - kiedy odchodzisz, robi się pięknie.`,
        `Nie mówię, że ${target.username} jest leniwy, ale mógłby dostać nagrodę za najmniejszy wysiłek.`,
        `${target.username}, twoje szanse na sukces są jak szanse na to, że świnia poleci.`,
        `Gdyby ${target.username} był filmem, byłby najniżej ocenianym filmem na IMDb.`,
        `${target.username}, jesteś jak poniedziałek - nikt cię nie lubi.`,
        `Twoje poczucie humoru jest tak suche jak Sahara, ${target.username}.`
    ];
    
    const randomRoast = roasts[Math.floor(Math.random() * roasts.length)];
    
    const embed = new EmbedBuilder()
        .setTitle('🔥 Roast!')
        .setColor(0xED4245)
        .setDescription(randomRoast)
        .addFields(
            { name: '🎯 Ofiara', value: target.username, inline: true },
            { name: '😈 Kat', value: message.author.username, inline: true }
        )
        .setFooter({ text: 'BotNexus • Tylko żart!' })
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}
