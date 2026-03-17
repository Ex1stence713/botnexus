import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import economy from '../utils/economy.js';

export const name = 'leaderboard';
export const description = 'Top 10 najbogatszych użytkowników';

export async function execute(message, args) {
    const leaderboard = economy.getLeaderboard();
    
    // Sortujemy i bierzemy top 10
    const top10 = leaderboard.slice(0, 10);
    
    if (top10.length === 0) {
        const emptyEmbed = new EmbedBuilder()
            .setTitle('🏆 Ranking')
            .setDescription('Brak użytkowników w rankingu!')
            .setColor(0x5865F2);
        return message.reply({ embeds: [emptyEmbed] });
    }
    
    // Pobierz max monet dla paska
    const maxCoins = Math.max(...top10.map(e => e.coins));
    
    let rankingDescription = '';
    const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    
    for (let i = 0; i < top10.length; i++) {
        const entry = top10[i];
        const user = await message.client.users.fetch(entry.userId).catch(() => null);
        const username = user ? user.username : 'Nieznany';
        const avatar = user ? user.displayAvatarURL({ dynamic: true }) : null;
        
        // Oblicz poziom
        const level = Math.floor(Math.sqrt(entry.totalEarned / 100)) + 1;
        
        // Pasek postępu
        const barLength = 10;
        const barPercent = maxCoins > 0 ? entry.coins / maxCoins : 0;
        const filledBars = Math.round(barPercent * barLength);
        const bar = '█'.repeat(filledBars) + '░'.repeat(barLength - filledBars);
        
        // Format numer 1 z specjalnym stylem
        let medalEmoji = medal[i];
        let color = 0x5865F2;
        
        if (i === 0) {
            medalEmoji = '👑';
            color = 0xFFD700; // Złoto
        } else if (i === 1) {
            color = 0xC0C0C0; // Srebro
        } else if (i === 2) {
            color = 0xCD7F32; // Brąz
        }
        
        rankingDescription += `${medalEmoji} **${username}**\n`;
        rankingDescription += `   💰 ${entry.coins.toLocaleString()} monet\n`;
        rankingDescription += `   📊 ${bar} (${Math.round(barPercent * 100)}%)\n`;
        rankingDescription += `   📈 Poziom: ${level}\n\n`;
    }
    
    const totalUsers = leaderboard.length;
    const totalCoins = leaderboard.reduce((sum, e) => sum + e.coins, 0);
    const avgCoins = totalUsers > 0 ? Math.round(totalCoins / totalUsers) : 0;
    
    const leaderboardEmbed = new EmbedBuilder()
        .setTitle('🏆 Top 10 Najbogatszych')
        .setDescription(rankingDescription)
        .setColor(0xFFD700)
        .setThumbnail(message.guild?.iconURL({ dynamic: true }))
        .addFields(
            { name: '📊 Statystyki serwera:', value: `👥 Łącznie użytkowników: **${totalUsers}**\n💰 Średnio monet: **${avgCoins.toLocaleString()}**\n💎 Łącznie monet: **${totalCoins.toLocaleString()}**`, inline: false }
        )
        .setFooter({ text: 'BotNexus • Zostań #1!' })
        .setTimestamp();

    // Dodaj przyciski nawigacji jeśli jest więcej użytkowników
    const row = new ActionRowBuilder();
    
    if (leaderboard.length > 10) {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId('lb_next')
                .setLabel('Następna strona ➡️')
                .setStyle(ButtonStyle.Secondary)
        );
    }
    
    if (row.components.length > 0) {
        await message.reply({ embeds: [leaderboardEmbed], components: [row] });
    } else {
        await message.reply({ embeds: [leaderboardEmbed] });
    }
}
