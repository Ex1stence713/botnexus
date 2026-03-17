import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import economy from '../utils/economy.js';

export const name = 'daily';
export const description = 'Odbierz codzienną nagrodę';

export async function execute(message, args) {
    const userId = message.author.id;
    
    if (!economy.canClaimDaily(userId)) {
        const user = economy.getUser(userId);
        const lastClaim = new Date(user.lastDaily);
        const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
        
        // Oblicz czas
        const diff = nextClaim - new Date();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        // Oblicz poziom
        const level = Math.floor(Math.sqrt(user.totalEarned / 100)) + 1;
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('⏰ Jeszcze nie czas!')
            .setDescription(`Możesz odebrać kolejną nagrodę za **${hours}h ${minutes}m**`)
            .setColor(0xED4245)
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '💰 Twoje monety', value: `**${user.coins.toLocaleString()}**`, inline: true },
                { name: '📈 Poziom', value: `**${level}**`, inline: true },
                { name: '🔥 Seria', value: `**${user.dailyStreak}** dni`, inline: true }
            )
            .setFooter({ text: 'Wróć później!' })
            .setTimestamp();
        
        return message.reply({ embeds: [errorEmbed] });
    }
    
    const user = economy.updateDailyStreak(userId);
    
    // Oblicz nagrodę na podstawie serii
    let baseReward = 100;
    let streakBonus = Math.min(user.dailyStreak, 30) * 10; // Maksymalny bonus to 300
    let totalReward = baseReward + streakBonus;
    
    // Dodaj monety
    economy.addCoins(userId, totalReward);
    
    // Nowy poziom po nagrodzie
    const newUser = economy.getUser(userId);
    const newLevel = Math.floor(Math.sqrt(newUser.totalEarned / 100)) + 1;
    const leveledUp = newLevel > user.dailyStreak; // Use streak as proxy for level check
    
    const dailyEmbed = new EmbedBuilder()
        .setTitle('🎁 Codzienna nagroda!')
        .setDescription(leveledUp 
            ? `🎉 **AWANSOWAŁEŚ NA POZIOM ${newLevel}!**`
            : `Odebrałeś swoją nagrodę dzienną!`)
        .setColor(0x57F287)
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '💵 Nagroda', value: `**${totalReward.toLocaleString()}** 🪙`, inline: true },
            { name: '🔥 Seria', value: `**${user.dailyStreak}** dni 🔥`, inline: true },
            { name: '⭐ Bonus za serie', value: `+${streakBonus} 🪙`, inline: false }
        )
        .addFields(
            { name: '💰 Saldo', value: `**${newUser.coins.toLocaleString()}** 🪙`, inline: true },
            { name: '📈 Poziom', value: `**${newLevel}**`, inline: true }
        )
        .setFooter({ text: 'Wróć jutro po kolejną nagrodę! • BotNexus' })
        .setTimestamp();

    // Dodaj emotki bonusu serii
    if (user.dailyStreak >= 7) {
        dailyEmbed.setDescription(`🎁 **TYGODNIOWA SERIA!**\nOdebrałeś nagrodę ${user.dailyStreak} dzień z rzędu!`);
    } else if (user.dailyStreak >= 30) {
        dailyEmbed.setDescription(`🏆 **MIESIĘCZNA SERIA!**\nJesteś niesamowity! ${user.dailyStreak} dni z rzędu!`);
    }

    // Dodaj przyciski
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('daily_claim')
                .setLabel('🎁 Odebrane!')
                .setStyle(ButtonStyle.Success)
                .setDisabled(true)
        );

    await message.reply({ embeds: [dailyEmbed], components: [row] });
}
