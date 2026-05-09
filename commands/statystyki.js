import { EmbedBuilder } from 'discord.js';

export const name = 'statystyki';
export const description = 'Wyświetla statystyki serwera';

export async function execute(message, args) {
    const guild = message.guild;

    if (!guild) {
        return message.reply('❌ Ta komenda działa tylko na serwerach!');
    }

    // Pobierz członków online/offline
    const members = guild.members.cache;
    const onlineMembers = members.filter(m =>
        m.presence?.status === 'online' ||
        m.presence?.status === 'idle' ||
        m.presence?.status === 'dnd'
    ).size;
    const offlineMembers = members.filter(m => !m.presence || m.presence.status === 'offline').size;

    // Liczba ludzi vs botów
    const humans = members.filter(m => !m.user.bot).size;
    const bots = members.filter(m => m.user.bot).size;

    // Liczba kanałów
    const textChannels = guild.channels.cache.filter(c => c.isTextBased() && !c.isThread()).size;
    const voiceChannels = guild.channels.cache.filter(c => c.isVoiceBased()).size;
    const threads = guild.channels.cache.filter(c => c.isThread()).size;
    const categories = guild.channels.cache.filter(c => c.type === 4).size; // GUILD_CATEGORY

    // Liczba ról
    const roles = guild.roles.cache;
    const roleCount = roles.size;

    // Emoji
    const emojis = guild.emojis.cache;
    const staticEmojis = emojis.filter(e => !e.animated).size;
    const animatedEmojis = emojis.filter(e => e.animated).size;

    // Stickers
    const stickers = guild.stickers.cache.size;

    // Boosty
    const boosts = guild.premiumSubscriptionCount || 0;
    const boostLevel = guild.premiumTier;

    const boostLevelMap = {
        0: 'Brak',
        1: 'Poziom 1',
        2: 'Poziom 2',
        3: 'Poziom 3'
    };

    // Właściciel
    const owner = await guild.fetchOwner().catch(() => null);

    // Data utworzenia
    const createdAt = guild.createdAt;
    const daysOld = Math.floor((Date.now() - createdAt.getTime()) / 86400000);

    const embed = new EmbedBuilder()
        .setTitle('📊 Statystyki serwera')
        .setColor('#5865F2')
        .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
        .addFields(
            {
                name: '👥 Użytkownicy',
                value: `**Łącznie:** ${guild.memberCount}\n🟢 Online: ${onlineMembers}\n⚫ Offline: ${offlineMembers}\n👤 Ludzie: ${humans}\n🤖 Boty: ${bots}`,
                inline: true
            },
            {
                name: '💬 Kanały',
                value: `📝 Tekstowe: ${textChannels}\n🔊 Głosowe: ${voiceChannels}\n🧵 Wątki: ${threads}\n📁 Kategorie: ${categories}`,
                inline: true
            },
            {
                name: '🎨 Emoji i inne',
                value: `🟣 Statyczne emoji: ${staticEmojis}\n🟣 Animowane emoji: ${animatedEmojis}\n🏷️ Stickery: ${stickers}`,
                inline: true
            },
            {
                name: '─────────────────',
                value: '**🔨 Ustawienia serwera**',
                inline: false
            },
            {
                name: '🔑 Rola najwyższa',
                value: `${guild.roles.highest}`,
                inline: true
            },
            {
                name: '🌟 Poziom boostów',
                value: `${boostLevelMap[boostLevel] || 'Brak'} (${boosts} boostów)`,
                inline: true
            },
            {
                name: '👑 Właściciel',
                value: `${owner || 'Nieznany'}`,
                inline: true
            },
            {
                name: '📅 Data utworzenia',
                value: `<t:${Math.floor(createdAt.getTime() / 1000)}:D> (${daysOld} dni)`,
                inline: true
            },
            {
                name: '🆔 ID serwera',
                value: `${guild.id}`,
                inline: false
            }
        )
        .setFooter({
            text: `Zażądane przez ${message.author.tag}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();

    try {
        await message.reply({ embeds: [embed] });
    } catch (err) {
        console.error(err);
        return message.reply('❌ Nie udało się wyświetlić statystyk.');
    }
}