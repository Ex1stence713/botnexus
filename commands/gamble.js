import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
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
        // Pokaż pomoc
        const helpEmbed = new EmbedBuilder()
            .setTitle('🎰 Automat do gry')
            .setDescription('Spróbuj szczęścia na automacie!')
            .setColor(0x5865F2)
            .addFields(
                { name: 'Jak grać?', value: 'Użyj `!gamble <stawka>`', inline: false },
                { name: '📊 Wygrane:', value: `
🍒🍒🍒 = 6x stawki
🍋🍋🍋 = 9x stawki
🍊🍊🍊 = 12x stawki
🍇🍇🍇 = 15x stawki
💎💎💎 = 30x stawki
⭐⭐⭐ = 60x stawki
Dowolne 💎 = 1x stawki
2 takie same = 2-6x stawki`, inline: false },
                { name: '⚠️ Zasady:', value: '- Minimalna stawka: 1 🪙\n- Maksymalna stawka: 10,000 🪙\n- Musisz mieć wystarczająco monet!', inline: false }
            )
            .setThumbnail(message.client.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'Powodzenia! 🎲' });
        
        return message.reply({ embeds: [helpEmbed] });
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
            .setColor(0xED4245)
            .setFooter({ text: 'Zrób !daily żeby zdobyć monety!' });
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
    let winColor = 0x57F287;
    
    // Sprawdź wszystkie 3 takie same
    if (slot1 === slot2 && slot2 === slot3) {
        multiplier = PAYOUTS[slot1] * 3;
        if (slot1 === '⭐') {
            winMessage = '🎉 JACKPOT! TRZY GWIAZDKI!';
            winColor = 0xFFD700; // Złoto
        } else if (slot1 === '💎') {
            winMessage = '💎 SUPREME! TRZY DIAMENTY!';
            winColor = 0x3498DB; // Niebieski
        } else {
            winMessage = '🎉 JACKPOT! Trzy takie same!';
        }
    }
    // Sprawdź 2 takie same
    else if (slot1 === slot2 || slot1 === slot3 || slot2 === slot3) {
        const match = slot1 === slot2 ? slot1 : (slot1 === slot3 ? slot1 : slot2);
        multiplier = PAYOUTS[match] * 2;
        winMessage = '⭐ Blisko! Dwa takie same!';
    }
    // Bonus za 💎 w dowolnym miejscu
    else if (slot1 === '💎' || slot2 === '💎' || slot3 === '💎') {
        multiplier = 1;
        winMessage = '💎 Bonus! Znalazłeś diament!';
    }
    
    const winnings = bet * multiplier;
    const isWin = winnings > 0;
    
    if (isWin) {
        economy.addCoins(userId, winnings);
    }
    
    const newBalance = economy.getUser(userId);
    
    const gambleEmbed = new EmbedBuilder()
        .setTitle(isWin ? '🎰 WYGRANA!' : '🎰 PRZEGRAŁEŚ!')
        .setDescription(winMessage)
        .setColor(isWin ? winColor : 0xED4245)
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '🎰', value: `**${slot1} ${slot2} ${slot3}**`, inline: false },
            { name: '💰 Stawka', value: `**${bet.toLocaleString()}** 🪙`, inline: true },
            { name: isWin ? '💎 Wygrana' : '📉 Przegrałeś', value: `**${winnings.toLocaleString()}** 🪙`, inline: true }
        )
        .addFields(
            { name: '💵 Twoje monety', value: `**${newBalance.coins.toLocaleString()}** 🪙`, inline: false }
        )
        .setFooter({ text: isWin ? 'Gratulacje! 🎉' : 'Spróbuj jeszcze raz!' })
        .setTimestamp();

    await message.reply({ embeds: [gambleEmbed] });
}
