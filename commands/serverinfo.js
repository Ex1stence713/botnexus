import { EmbedBuilder } from 'discord.js';

export const name = 'serverinfo';
export const description = 'Wyświetla informacje o serwerze';

export async function execute(message, args) {
    const guild = message.guild;
    
    if (!guild) {
        return message.reply('Ta komenda działa tylko na serwerze!');
    }
    
    await guild.members.fetch();
    await guild.channels.fetch();
    
    const owner = await guild.fetchOwner();
    const members = guild.members.cache;
    const channels = guild.channels.cache;
    
    const textChannels = channels.filter(c => c.type === 0).size;
    const voiceChannels = channels.filter(c => c.type === 2).size;
    const categories = channels.filter(c => c.type === 4).size;
    
    const humans = members.filter(m => !m.user.bot).size;
    const bots = members.filter(m => m.user.bot).size;
    const online = members.filter(m => m.presence?.status !== 'offline').size;
    
    const verificationLevels = {
        0: 'Brak',
        1: 'Niski',
        2: 'Średni',
        3: 'Wysoki',
        4: 'Najwyższy'
    };
    
    const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`📊 ${guild.name}`)
        .setThumbnail(guild.iconURL({ size: 256 }))
        .addFields(
            { name: '👑 Właściciel', value: owner.user.tag, inline: true },
            { name: '🆔 ID', value: guild.id, inline: true },
            { name: '📅 Utworzono', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
            { name: '👥 Członkowie', value: `**Wszyscy:** ${guild.memberCount}\n**Ludzie:** ${humans}\n**Boty:** ${bots}\n**Online:** ${online}`, inline: true },
            { name: '💬 Kanały', value: `**Tekstowe:** ${textChannels}\n**Głosowe:** ${voiceChannels}\n**Kategorie:** ${categories}`, inline: true },
            { name: '🎭 Role', value: guild.roles.cache.size.toString(), inline: true },
            { name: '😀 Emoji', value: guild.emojis.cache.size.toString(), inline: true },
            { name: '🛡️ Weryfikacja', value: verificationLevels[guild.verificationLevel], inline: true },
            { name: '📈 Boosty', value: `**Poziom:** ${guild.premiumTier}\n**Boosty:** ${guild.premiumSubscriptionCount || 0}`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `Serwer • ${guild.memberCount} członków` });
    
    if (guild.banner) {
        embed.setImage(guild.bannerURL({ size: 1024 }));
    }
    
    await message.reply({ embeds: [embed] });
}
