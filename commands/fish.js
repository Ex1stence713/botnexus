import { EmbedBuilder } from 'discord.js';
import economy from '../utils/economy.js';

export const name = 'fish';
export const description = 'Złow rybę!';

const fishTypes = [
    { name: '🐟 Płotka', chance: 25, coins: 10, icon: '🐟' },
    { name: '🐠 Karaś', chance: 20, coins: 20, icon: '🐠' },
    { name: '🐡 Okoń', chance: 15, coins: 35, icon: '🐡' },
    { name: '🦈 Szczupak', chance: 10, coins: 75, icon: '🦈' },
    { name: '🐋 Humpback', chance: 5, coins: 150, icon: '🐋' },
    { name: '🐙 ośmiornica', chance: 5, coins: 100, icon: '🐙' },
    { name: '🦑 Opona', chance: 4, coins: 120, icon: '🦑' },
    { name: '🐢 Żółw morski', chance: 3, coins: 200, icon: '🐢' },
    { name: '🦐 Krewetka', chance: 3, coins: 250, icon: '🦐' },
    { name: '🐟 Karp', chance: 3, coins: 180, icon: '🐟' },
    { name: '🦈 Rekin', chance: 2, coins: 500, icon: '🦈' },
    { name: '🐠 TROPICZNA', chance: 2, coins: 400, icon: '🐠' },
    { name: '💎 Diamentowy Karp', chance: 0.5, coins: 1000, icon: '💎' },
    { name: '👢 Stary But', chance: 1.5, coins: -20, icon: '👢' }
];

const COOLDOWN_TIME = 25000; // 25 seconds
const cooldowns = new Map();

function catchFish() {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const fish of fishTypes) {
        cumulative += fish.chance;
        if (random <= cumulative) return fish;
    }

    return fishTypes[0];
}

export async function execute(message, args) {
    const userId = message.author.id;

    // Sprawdź cooldown
    if (cooldowns.has(userId)) {
        const expirationTime = cooldowns.get(userId) + COOLDOWN_TIME;
        const timeLeft = Math.ceil((expirationTime - Date.now()) / 1000);

        if (Date.now() < expirationTime) {
            const embed = new EmbedBuilder()
                .setTitle('⏳ Cooldown')
                .setDescription(`Musisz poczekać jeszcze **${timeLeft} sekund** przed następnym łowieniem!`)
                .setColor(0xED4245)
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '⏱️ Odliczanie', value: `${timeLeft}s`, inline: true },
                    { name: '💰 Saldo', value: `**${economy.getUser(userId).coins}** 🪙`, inline: true }
                )
                .setFooter({ text: 'Użyj !fish ponownie po upływie czasu' });
            return message.reply({ embeds: [embed] });
        }
    }

    // Ustaw cooldown
    cooldowns.set(userId, Date.now());
    setTimeout(() => cooldowns.delete(userId), COOLDOWN_TIME);

    // Animacja
    await message.reply('🎣 Zarzucasz wędkę...');
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Losuj rybę
    const caughtFish = catchFish();
    const user = economy.getUser(userId);

    if (caughtFish.coins < 0) {
        // Przywęska (negatywna nagroda)
        economy.addCoins(userId, caughtFish.coins);
        const newUser = economy.getUser(userId);

        const embed = new EmbedBuilder()
            .setTitle('👢 Ouch!')
            .setDescription(`**${message.author.username}** złowił **${caughtFish.name}**!`)
            .setColor(0xED4245)
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '💰 Koszt', value: `${caughtFish.coins} 🪙`, inline: true },
                { name: '💵 Saldo', value: `**${newUser.coins}** 🪙`, inline: true },
                { name: '⏰ Kolejne łowienie', value: `za ${COOLDOWN_TIME / 1000}s`, inline: false }
            )
            .setFooter({ text: 'Lepiej następnym razem!' });
        await message.reply({ embeds: [embed] });
        return;
    }

    // Dodaj monety
    economy.addCoins(userId, caughtFish.coins);
    const newUser = economy.getUser(userId);

    // Kolor zależny od rzadkości
    let embedColor = 0x57F287; // zielony
    if (caughtFish.coins >= 1000) embedColor = 0xFFD700; // złoty
    else if (caughtFish.coins >= 500) embedColor = 0x9B59B6; // fiolet
    else if (caughtFish.coins >= 150) embedColor = 0x3498DB; // niebieski
    else if (caughtFish.coins >= 75) embedColor = 0x2ECC71; // zielony

    const embed = new EmbedBuilder()
        .setTitle('🎣 Ryba złowiona!')
        .setDescription(`${caughtFish.icon} **${message.author.username}** złowił **${caughtFish.name}**!`)
        .setColor(embedColor)
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '💰 Nagroda', value: `**+${caughtFish.coins.toLocaleString()}** 🪙`, inline: true },
            { name: '💵 Saldo', value: `**${newUser.coins.toLocaleString()}** 🪙`, inline: true },
            { name: '⏰ Kolejne łowienie', value: `za ${COOLDOWN_TIME / 1000}s`, inline: false }
        )
        .setFooter({ text: 'Rybka mocno się wywiązała!' })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
}
