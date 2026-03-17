import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import economy from '../utils/economy.js';

export const name = 'balance';
export const description = 'Sprawdź stan swojego konta';

export async function execute(message, args) {
    let targetUser = message.author;
    
    if (args.length > 0) {
        const userId = args[0].replace(/<@!/g, '').replace(/<@/g, '').replace(/>/g, '');
        try {
            targetUser = await message.client.users.fetch(userId);
        } catch (e) {
            return message.reply('Nie znaleziono użytkownika!');
        }
    }
    
    const user = economy.getUser(targetUser.id);
    
    // Oblicz poziom na podstawie całkowitych zarobków
    const level = Math.floor(Math.sqrt(user.totalEarned / 100)) + 1;
    const nextLevel = level + 1;
    const currentLevelExp = Math.pow(level - 1, 2) * 100;
    const nextLevelExp = Math.pow(nextLevel - 1, 2) * 100;
    const expInLevel = user.totalEarned - currentLevelExp;
    const expNeeded = nextLevelExp - currentLevelExp;
    const progress = Math.min(100, Math.round((expInLevel / expNeeded) * 100));
    
    // Pasek postępu poziomu
    const barLength = 20;
    const filledBars = Math.round((progress / 100) * barLength);
    const progressBar = '█'.repeat(filledBars) + '░'.repeat(barLength - filledBars);
    
    // Kolor karty zależy od poziomu
    let cardColor = 0x5865F2;
    let rankEmoji = '🌱';
    let rankName = 'Początkujący';
    
    if (level >= 50) {
        cardColor = 0xFFD700;
        rankEmoji = '👑';
        rankName = 'Mistrz';
    } else if (level >= 40) {
        cardColor = 0xFF6B6B;
        rankEmoji = '🔥';
        rankName = 'Ekspert';
    } else if (level >= 30) {
        cardColor = 0x9B59B6;
        rankEmoji = '💎';
        rankName = 'Zaawansowany';
    } else if (level >= 20) {
        cardColor = 0x3498DB;
        rankEmoji = '⭐';
        rankName = 'Średniozaawansowany';
    } else if (level >= 10) {
        cardColor = 0x2ECC71;
        rankEmoji = '🌿';
        rankName = 'Początkujący';
    }

    const balanceEmbed = new EmbedBuilder()
        .setTitle(`${rankEmoji} Konto użytkownika: ${targetUser.username}`)
        .setColor(cardColor)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '💰 Monety', value: `**${user.coins.toLocaleString()}** 🪙`, inline: true },
            { name: `${rankEmoji} Poziom`, value: `**${level}** (${rankName})`, inline: true },
            { name: '📊 Postęp poziomu', value: `${progressBar} ${progress}%`, inline: false },
            { name: '📈 Do następnego poziomu:', value: `💎 ${(expNeeded - expInLevel).toLocaleString()} XP`, inline: true },
            { name: '💵 Łącznie zarobione', value: `**${user.totalEarned.toLocaleString()}**`, inline: true },
            { name: '🛒 Łącznie wydane', value: `**${user.totalSpent.toLocaleString()}**`, inline: true },
            { name: '🔥 Seria daily', value: `**${user.dailyStreak}** dni 🔥`, inline: true }
        )
        .setFooter({ text: `Zapytanie od: ${message.author.tag} • BotNexus` })
        .setTimestamp();

    // Dodaj ekwipunek jeśli jest
    if (user.inventory.length > 0) {
        balanceEmbed.addFields(
            { name: '🎒 Ekwipunek', value: user.inventory.join(', '), inline: false }
        );
    }

    // Dodaj przyciski
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('bal_daily')
                .setLabel('🎁 Daily')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('bal_gamble')
                .setLabel('🎰 Gamble')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('bal_shop')
                .setLabel('🏪 Sklep')
                .setStyle(ButtonStyle.Secondary)
        );

    await message.reply({ embeds: [balanceEmbed], components: [row] });
}
