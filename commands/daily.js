import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import economy from '../utils/economy.js';

export const data = new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Odbierz codzienną nagrodę');

export async function execute(interaction) {
    const userId = interaction.user.id;
    
    if (!economy.canClaimDaily(userId)) {
        const user = economy.getUser(userId);
        const lastClaim = new Date(user.lastDaily);
        const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
        const hoursLeft = Math.ceil((nextClaim - new Date()) / (1000 * 60 * 60));
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('⏰ Jeszcze nie czas!')
            .setDescription(`Możesz odebrać kolejną nagrodę za **${hoursLeft} godzin**`)
            .setColor(0xED4245);
        
        return interaction.reply({ embeds: [errorEmbed] });
    }
    
    const user = economy.updateDailyStreak(userId);
    
    // Oblicz nagrodę na podstawie serii
    let baseReward = 100;
    let streakBonus = Math.min(user.dailyStreak, 30) * 10; // Maksymalny bonus to 300
    let totalReward = baseReward + streakBonus;
    
    // Dodaj monety
    economy.addCoins(userId, totalReward);
    
    const dailyEmbed = new EmbedBuilder()
        .setTitle('🎁 Codzienna nagroda!')
        .setDescription(`Odebrałeś swoją nagrodę dzienną`)
        .setColor(0x57F287)
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '💵 Nagroda', value: `**${totalReward.toLocaleString()}** monet`, inline: true },
            { name: '🔥 Seria', value: `**${user.dailyStreak}** dni`, inline: true },
            { name: '⭐ Bonus za serie', value: `+${streakBonus} monet`, inline: false },
            { name: '💰 Aktualny stan konta', value: `**${user.coins.toLocaleString()}** monet`, inline: false }
        )
        .setFooter({ text: 'Wróć jutro po kolejną nagrodę!' })
        .setTimestamp();
    
    await interaction.reply({ embeds: [dailyEmbed] });
}
