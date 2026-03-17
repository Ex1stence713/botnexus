import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const name = 'userinfo';
export const description = 'Wyświetla szczegółowe informacje o użytkowniku';

export async function execute(message, args) {
    let user = message.author;
    let member = null;
    
    if (args.length > 0) {
        const userId = args[0].replace(/<@!/g, '').replace(/<@/g, '').replace(/>/g, '');
        try {
            user = await message.client.users.fetch(userId);
            if (message.guild) {
                member = await message.guild.members.fetch(userId).catch(() => null);
            }
        } catch (e) {
            return message.reply('Nie znaleziono użytkownika!');
        }
    } else if (message.guild) {
        member = message.member;
    }

    const accountAge = Date.now() - user.createdTimestamp;
    const daysOld = Math.floor(accountAge / (1000 * 60 * 60 * 24));
    
    let roleColor = '#5865F2';
    if (member && member.roles.highest.color !== 0) {
        roleColor = '#' + member.roles.highest.color.toString(16).padStart(6, '0');
    }

    const embed = new EmbedBuilder()
        .setTitle('👤 ' + user.username)
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setColor(roleColor)
        .addFields(
            { name: '🆔 ID', value: user.id, inline: true },
            { name: '📅 Konto utworzone', value: '<t:' + Math.floor(user.createdTimestamp / 1000) + ':R>\n(' + daysOld + ' dni temu)', inline: true }
        );

    if (member) {
        const joinAge = Date.now() - member.joinedTimestamp;
        const daysOnServer = Math.floor(joinAge / (1000 * 60 * 60 * 24));
        
        embed.addFields(
            { name: '📥 Dołączył na serwer', value: '<t:' + Math.floor(member.joinedTimestamp / 1000) + ':R>\n(' + daysOnServer + ' dni temu)', inline: true },
            { name: '🔝 Najwyższa rola', value: member.roles.highest.name, inline: true }
        );
        
        let statusText = '⚪ Offline';
        
        if (member.presence?.status === 'online') statusText = '🟢 Online';
        else if (member.presence?.status === 'idle') statusText = '🟡 Nieaktywny';
        else if (member.presence?.status === 'dnd') statusText = '🔴 Nie przeszkadzać';
        
        let activityText = 'Brak';
        if (member.presence?.activities && member.presence.activities.length > 0) {
            const activity = member.presence.activities[0];
            if (activity) {
                if (activity.type === 0) activityText = '🎮 Gra: ' + activity.name;
                else if (activity.type === 1) activityText = '🔴 ' + activity.name;
                else if (activity.type === 2) activityText = '🎵 Słucha: ' + activity.name;
                else if (activity.type === 3) activityText = '📺 Ogląda: ' + activity.name;
            }
        }
        
        embed.addFields(
            { name: '💫 Status', value: statusText, inline: true },
            { name: '📱 Aktywność', value: activityText, inline: true }
        );
        
        const roles = member.roles.cache
            .sort((a, b) => b.position - a.position)
            .filter(r => r.id !== r.guild.id)
            .map(r => r.name)
            .slice(0, 10);
        
        const rolesText = roles.length > 0 ? roles.join(', ') : 'Brak ról';
        
        embed.addFields(
            { name: '🎭 Role (' + (member.roles.cache.size - 1) + ')', value: rolesText, inline: false }
        );
    }

    embed.setFooter({ text: 'Zapytanie od: ' + message.author.tag + ' • BotNexus' })
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('ui_avatar')
                .setLabel('🖼️ Avatar')
                .setStyle(ButtonStyle.Secondary)
        );

    await message.reply({ embeds: [embed], components: [row] });
}
