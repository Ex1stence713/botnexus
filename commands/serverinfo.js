import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

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
        0: '🔓 Brak',
        1: '🟢 Niski',
        2: '🟡 Średni',
        3: '🟠 Wysoki',
        4: '🔒 Najwyższy'
    };
    
    // Oblicz procent online
    const onlinePercent = guild.memberCount > 0 ? Math.round((online / guild.memberCount) * 100) : 0;
    const onlineBar = '█'.repeat(Math.round(onlinePercent / 10)) + '░'.repeat(10 - Math.round(onlinePercent / 10));
    
    const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`📊 ${guild.name}`)
        .setThumbnail(guild.iconURL({ size: 256 }))
        .setDescription(guild.description || 'Brak opisu serwera')
        .addFields(
            { name: '👑 Właściciel', value: owner.user.tag, inline: true },
            { name: '🆔 ID', value: guild.id, inline: true },
            { name: '📅 Utworzono', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true }
        )
        .addFields(
            { name: '─────────────────', value: '**👥 Członkowie:**', inline: false },
            { name: '💚 Online', value: `**${online}** ${onlineBar} (${onlinePercent}%)`, inline: false },
            { name: '👤 Ludzie', value: `**${humans}**`, inline: true },
            { name: '🤖 Boty', value: `**${bots}**`, inline: true },
            { name: '📈 Łącznie', value: `**${guild.memberCount}**`, inline: true }
        )
        .addFields(
            { name: '─────────────────', value: '**💬 Kanały:**', inline: false },
            { name: '💬 Tekstowe', value: `**${textChannels}**`, inline: true },
            { name: '🔊 Głosowe', value: `**${voiceChannels}**`, inline: true },
            { name: '📁 Kategorie', value: `**${categories}**`, inline: true }
        )
        .addFields(
            { name: '🎭 Role', value: `**${guild.roles.cache.size}**`, inline: true },
            { name: '😀 Emoji', value: `**${guild.emojis.cache.size}**`, inline: true },
            { name: '🛡️ Weryfikacja', value: verificationLevels[guild.verificationLevel], inline: true },
            { name: '📈 Boosty', value: `Poziom: **${guild.premiumTier}** | Ilość: **${guild.premiumSubscriptionCount || 0}**`, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: `Serwer • ${guild.memberCount} członków` });

    if (guild.banner) {
        embed.setImage(guild.bannerURL({ size: 1024 }));
    }

    // Dodaj przyciski
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('si_emojilist')
                .setLabel('😀 Emoji')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('si_roles')
                .setLabel('🎭 Role')
                .setStyle(ButtonStyle.Secondary)
        );

    await message.reply({ embeds: [embed], components: [row] });
}
