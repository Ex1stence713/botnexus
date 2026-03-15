import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import economy from '../utils/economy.js';

export const data = new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Sprawdź stan swojego konta')
    .addUserOption(opt => opt.setName('user').setDescription('Sprawdź konto innego użytkownika').setRequired(false));

export async function execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
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
    
    await interaction.reply({ embeds: [balanceEmbed] });
}
