import { EmbedBuilder } from 'discord.js';
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
    const nextLevelExp = Math.pow(nextLevel - 1, 2) * 100;
    const progress = ((user.totalEarned - Math.pow(level - 1, 2) * 100) / (nextLevelExp - Math.pow(level - 1, 2) * 100)) * 100;
    
    const balanceEmbed = new EmbedBuilder()
        .setTitle(`💰 Stan konta ${targetUser.username}`)
        .setColor(0xFFD700)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '💵 Monety', value: `**${user.coins.toLocaleString()}**`, inline: true },
            { name: '📈 Poziom', value: `**${level}**`, inline: true },
            { name: '📊 Postęp do następnego poziomu', value: `${Math.floor(progress)}%`, inline: false },
            { name: '💰 Łącznie zarobione', value: `**${user.totalEarned.toLocaleString()}**`, inline: true },
            { name: '🛒 Łącznie wydane', value: `**${user.totalSpent.toLocaleString()}**`, inline: true },
            { name: '🔥 Seria daily', value: `**${user.dailyStreak}** dni`, inline: true }
        )
        .setTimestamp();
    
    if (user.inventory.length > 0) {
        balanceEmbed.addFields(
            { name: '🎒 Ekwipunek', value: user.inventory.join(', '), inline: false }
        );
    }
    
    await message.reply({ embeds: [balanceEmbed] });
}
