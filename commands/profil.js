import { EmbedBuilder } from 'discord.js';

export const name = 'profil';
export const description = 'Wyświetla rozbudowany profil użytkownika';

export async function execute(message, args) {
    // Wybierz użytkownika — wspomnienie lub autor wiadomości
    const target = message.mentions.members?.first() || message.member;

    const { user, member } = target;

    // Status użytkownika
    const statusMap = {
        online: '🟢 Online',
        idle: '🟡 Nieaktywny',
        dnd: '🔴 Nie przeszkadzać',
        offline: '⚫ Offline'
    };
    const status = statusMap[member.presence?.status || 'offline'] || '⚫ Offline';

    // Rola najwyższa (poza @everyone)
    const roles = member.roles.cache
        .filter(r => r.id !== message.guild.id)
        .sort((a, b) => b.position - a.position);
    const topRole = roles.first();

    // Kiedy dołączył
    const joinedAt = member.joinedAt;
    const joinedDiscord = user.createdAt;

    // Czas na serwerze
    const daysOnServer = Math.floor((Date.now() - joinedAt.getTime()) / 86400000);
    const daysSinceCreation = Math.floor((Date.now() - joinedDiscord.getTime()) / 86400000);

    // Liczba ról
    const roleCount = roles.size;

    // Avatar w dużym rozmiarze
    const avatarURL = user.displayAvatarURL({ dynamic: true, size: 512 });

    // Badges
    const flags = user.flags?.toArray() || [];
    const badgesMap = {
        BugHunterLevel1: '🐛 Bug Hunter',
        BugHunterLevel2: '🐛 Bug Hunter Level 2',
        CertifiedModerator: '🛡️ Certified Moderator',
        HypeSquadOnlineHouse1: '🏠 Bravery',
        HypeSquadOnlineHouse2: '💚 Brilliance',
        HypeSquadOnlineHouse3: '⚖️ Balance',
        Hypesquad: '🏠 HypeSquad',
        Partner: '🤝 Partner',
        PremiumEarlySupporter: '⭐ Early Supporter',
        Staff: '👨‍💻 Discord Staff',
        ActiveDeveloper: '🔧 Active Developer',
        VerifiedBot: '🤖 Verified Bot',
        VerifiedDeveloper: '🔧 Verified Developer',
        Spammer: '🚫 Spammer'
    };
    const userBadges = flags.map(f => badgesMap[f] || f).join(' ') || 'Brak odznaczeń';

    const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setAuthor({
            name: `${user.tag}`,
            iconURL: avatarURL
        })
        .setThumbnail(avatarURL)
        .addFields(
            {
                name: '👤 Nazwa użytkownika',
                value: `${user.username}`,
                inline: true
            },
            {
                name: '🏷️ Tag',
                value: `${user.tag}`,
                inline: true
            },
            {
                name: '🆔 ID',
                value: `${user.id}`,
                inline: true
            },
            {
                name: '📝 Status',
                value: `${status}`,
                inline: true
            },
            {
                name: '🎭 Najwyższa rola',
                value: `${topRole || 'Brak'}`,
                inline: true
            },
            {
                name: '📊 Liczba ról',
                value: `${roleCount}`,
                inline: true
            },
            {
                name: '📅 Dołączył do serwera',
                value: `<t:${Math.floor(joinedAt.getTime() / 1000)}:D> (${daysOnServer} dni)`,
                inline: true
            },
            {
                name: '🔔 Konto Discord od',
                value: `<t:${Math.floor(joinedDiscord.getTime() / 1000)}:D> (${daysSinceCreation} dni)`,
                inline: true
            },
            {
                name: '🏅 Odznaczenia',
                value: `${userBadges}`,
                inline: false
            }
        )
        .setFooter({
            text: `Profil zażądany przez ${message.author.tag}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();

    try {
        await message.reply({ embeds: [embed] });
    } catch (err) {
        console.error(err);
        return message.reply('❌ Nie udało się wyświetlić profilu.');
    }
}