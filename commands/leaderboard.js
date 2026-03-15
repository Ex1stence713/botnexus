import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import economy from '../utils/economy.js';

export const data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Top 10 najbogatszych użytkowników');

export async function execute(interaction) {
    const leaderboard = economy.getLeaderboard();
    
    if (leaderboard.length === 0) {
        const emptyEmbed = new EmbedBuilder()
            .setTitle('📊 Ranking')
            .setDescription('Brak użytkowników w rankingu!')
            .setColor(0x5865F2);
        return interaction.reply({ embeds: [emptyEmbed] });
    }
    
    const leaderboardEmbed = new EmbedBuilder()
        .setTitle('🏆 Top 10 Najbogatszych')
        .setColor(0xFFD700)
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }));
    
    const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    
    for (let i = 0; i < leaderboard.length; i++) {
        const entry = leaderboard[i];
        const user = await interaction.client.users.fetch(entry.userId).catch(() => null);
        const username = user ? user.username : 'Nieznany';
        const level = Math.floor(Math.sqrt(entry.totalEarned / 100)) + 1;
        
        leaderboardEmbed.addFields({
            name: `${medal[i]} ${username}`,
            value: `💰 **${entry.coins.toLocaleString()}** monet\n📈 Poziom: ${level}`,
            inline: true
        });
    }
    
    leaderboardEmbed.setFooter({ text: `Łącznie użytkowników: ${leaderboard.length}` });
    leaderboardEmbed.setTimestamp();
    
    await interaction.reply({ embeds: [leaderboardEmbed] });
}
