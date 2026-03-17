import { EmbedBuilder } from 'discord.js';
import economy from '../utils/economy.js';

export const name = 'gamble';
export const description = 'Zagraj w automat (slot machine)';

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '⭐'];
const PAYOUTS = {
    '🍒': 2,
    '🍋': 3,
    '🍊': 4,
    '🍇': 5,
    '💎': 10,
    '⭐': 20
};

export async function execute(message, args) {
    if (args.length === 0) {
        return message.reply('Podaj stawkę! Użycie: !gamble <stawka>');
    }
    
    const bet = parseInt(args[0]);
    
    if (isNaN(bet)) {
        return message.reply('Podaj poprawną liczbę!');
    }
    
    const userId = message.author.id;
    const user = economy.getUser(userId);
    
    // Walidacja
    if (bet <= 0) {
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Błąd!')
            .setDescription('Stawka musi być większa od 0')
            .setColor(0xED4245);
        return message.reply({ embeds: [errorEmbed] });
    }
    
    if (user.coins < bet) {
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Brak środków!')
            .setDescription(`Potrzebujesz **${bet}** monet, a masz **${user.coins}**`)
            .setColor(0xED4245);
        return message.reply({ embeds: [errorEmbed] });
    }
    
    if (bet > 10000) {
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Zbyt duża stawka!')
            .setDescription('Maksymalna stawka to **10,000** monet')
            .setColor(0xED4245);
        return message.reply({ embeds: [errorEmbed] });
    }
    
    // Odejmij stawkę
    economy.removeCoins(userId, bet);
    
    // Losuj 3 symbole
    const spin = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const slot1 = spin();
    const slot2 = spin();
    const slot3 = spin();
    
    // Oblicz wygraną
    let multiplier = 0;
    let winMessage = '';
    
    // Sprawdź wszystkie 3 takie same
    if (slot1 === slot2 && slot2 === slot3) {
        multiplier = PAYOUTS[slot1] * 3;
        winMessage = '🎉 JACKPOT! Trzy takie same!';
    }
    // Sprawdź 2 takie same
    else if (slot1 === slot2 || slot1 === slot3 || slot2 === slot3) {
        const match = slot1 === slot2 ? slot1 : (slot1 === slot3 ? slot1 : slot2);
        multiplier = PAYOUTS[match] * 2;
        winMessage = '⭐ Dwa takie same!';
    }
    // Bonus za 3 różne 💎
    else if (slot1 === '💎' || slot2 === '💎' || slot3 === '💎') {
        multiplier = 1;
        winMessage = '💎 Bonus!';
    }
    
    const winnings = bet * multiplier;
    const isWin = winnings > 0;
    
    if (isWin) {
        economy.addCoins(userId, winnings);
    }
    
    const newBalance = economy.getUser(userId);
    
    const gambleEmbed = new EmbedBuilder()
        .setTitle(isWin ? '🎰 Wygrana!' : '🎰 Przegrałeś!')
        .setDescription(winMessage)
        .setColor(isWin ? 0x57F287 : 0xED4245)
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '🎰', value: `**${slot1} ${slot2} ${slot3}**`, inline: false },
            { name: '💰 Stawka', value: `**${bet.toLocaleString()}** monet`, inline: true },
            { name: isWin ? '💎 Wygrana' : '📉 Przegrałeś', value: `**${winnings.toLocaleString()}** monet`, inline: true },
            { name: '💵 Saldo', value: `**${newBalance.coins.toLocaleString()}** monet`, inline: false }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [gambleEmbed] });
}
