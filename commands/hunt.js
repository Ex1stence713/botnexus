import { EmbedBuilder } from 'discord.js';
import economy from '../utils/economy.js';

export const name = 'hunt';
export const description = 'Idź na łowy!';

const animals = [
    { name: '🐇 Zając', chance: 30, coins: 15, icon: '🐇' },
    { name: '🦌 Jeleń', chance: 25, coins: 30, icon: '🦌' },
    { name: '🐗 Dziki', chance: 15, coins: 60, icon: '🐗' },
    { name: '🦊 Lis', chance: 10, coins: 100, icon: '🦊' },
    { name: '🐺 Wilk', chance: 8, coins: 150, icon: '🐺' },
    { name: '🐻 Niedźwiedź', chance: 5, coins: 300, icon: '🐻' },
    { name: '🦌 Jeleń Łosowy', chance: 3, coins: 500, icon: '🦌' },
    { name: '✨ Jednorożec', chance: 1, coins: 2000, icon: '✨' },
    { name: '💨 Nic', chance: 3, coins: 0, icon: '💨' }
];

const COOLDOWN_TIME = 30000; // 30 seconds
const cooldowns = new Map();

function huntAnimal() {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const animal of animals) {
        cumulative += animal.chance;
        if (random <= cumulative) return animal;
    }

    return animals[0];
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
                .setDescription(`Musisz poczekać jeszcze **${timeLeft} sekund** przed następną polowaniem!`)
                .setColor(0xED4245)
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '⏱️ Odliczanie', value: `${timeLeft}s`, inline: true },
                    { name: '💰 Saldo', value: `**${economy.getUser(userId).coins}** 🪙`, inline: true }
                )
                .setFooter({ text: 'Użyj !hunt ponownie po upływie czasu' });
            return message.reply({ embeds: [embed] });
        }
    }

    // Ustaw cooldown
    cooldowns.set(userId, Date.now());
    setTimeout(() => cooldowns.delete(userId), COOLDOWN_TIME);

    // Animacja polowania
    await message.reply('🔄 Wypatrujesz w lesie...');
    await new Promise(resolve => setTimeout(resolve, 1500));

    await message.reply('🎯 Celujesz...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    await message.reply('💥 Strzał!');
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Losuj zwierzę
    const result = huntAnimal();
    const user = economy.getUser(userId);

    if (result.coins === 0) {
        const embed = new EmbedBuilder()
            .setTitle('🐾 Nic nie trafiłeś!')
            .setDescription('Przeszukałeś cały las, ale nie znalazłeś żadnej zwierzyny.')
            .setColor(0x5865F2)
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '💸 Koszt amunicji', value: `-5 🪙`, inline: true },
                { name: '💰 Saldo', value: `**${user.coins}** 🪙`, inline: true }
            )
            .setFooter({ text: 'Spróbuj ponownie za 30 sekund!' });

        economy.removeCoins(userId, 5);
        await message.reply({ embeds: [embed] });
        return;
    }

    // Dodaj monety
    economy.addCoins(userId, result.coins);
    const newUser = economy.getUser(userId);

    // Kolor zależny od wartości
    let embedColor = 0x57F287;
    if (result.coins >= 500) embedColor = 0xFFD700;
    else if (result.coins >= 150) embedColor = 0x9B59B6;
    else if (result.coins >= 60) embedColor = 0x3498DB;

    const embed = new EmbedBuilder()
        .setTitle('🎯 Polowanie udane!')
        .setDescription(`${result.icon} **${message.author.username}** upolował **${result.name}!**`)
        .setColor(embedColor)
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '💎 Nagroda', value: `**+${result.coins.toLocaleString()}** 🪙`, inline: true },
            { name: '💰 Nowe saldo', value: `**${newUser.coins.toLocaleString()}** 🪙`, inline: true },
            { name: '⏰ Kolejne polowanie', value: `za ${COOLDOWN_TIME / 1000} sekund`, inline: false }
        )
        .setFooter({ text: 'Powodzenia w kolejnych łowach!' })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
}
