import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export const name = 'dm';
export const description = 'Wyślij prywatną wiadomość do wszystkich użytkowników z określoną rolą.';

export async function execute(message, args) {
    const ownerId = process.env.BOT_OWNER_ID;
    const isOwner = message.author.id === ownerId;
    const hasPerm = message.member?.permissions?.has?.(PermissionFlagsBits.ManageGuild);

    if (!isOwner && !hasPerm) {
        return message.reply('Nie masz uprawnień do użycia tej komendy.');
    }
    
    if (args.length < 2) {
        return message.reply('Podaj rolę i wiadomość! Użycie: !dm <rola> <wiadomość>');
    }
    
    if (!message.guild) {
        return message.reply('Ta komenda działa tylko na serwerze!');
    }
    
    // Znajdź rolę
    const roleName = args[0];
    const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
    
    if (!role) {
        return message.reply('Nie znaleziono takiej roli!');
    }
    
    const text = args.slice(1).join(' ');
    
    // Prosta ochrona przed nadużyciem (limit długości)
    if (text.length > 2000) {
        return message.reply('Wiadomość jest za długa — max 2000 znaków.');
    }
    
    const roleMembers = role.members;

    if (roleMembers.size === 0) {
        return message.reply(`Nie znaleziono użytkowników z rolą ${role.name}.`);
    }

    // Tworzymy embed dla wiadomości
    const dmEmbed = new EmbedBuilder()
        .setTitle('📨 Nowa Wiadomość')
        .setDescription(text)
        .setColor(0x5865F2)
        .addFields(
            { name: '👤 Od', value: message.author.tag, inline: true },
            { name: '🏢 Serwer', value: message.guild?.name ?? 'DM', inline: true },
            { name: '⏰ Czas', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: false }
        )
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'Wiadomość wysłana przez bota serwera' })
        .setTimestamp();

    await message.reply('📤 Trwa wysyłanie wiadomości...');

    // Wysyłanie wiadomości do wszystkich członków z rolą
    let successCount = 0;
    let failCount = 0;
    const failedUsers = [];

    for (const [memberId, memberUser] of roleMembers) {
        try {
            await memberUser.send({ embeds: [dmEmbed] });
            successCount++;
        } catch (err) {
            failCount++;
            failedUsers.push(memberUser.tag);
            console.error(`Błąd przy wysyłaniu DM do ${memberUser.tag}:`, err);
        }
    }

    // Log
    console.log(`Wiadomość wysłana do ${successCount} użytkowników z rolą ${role.name} przez ${message.author.tag}`);

    // Embed z wynikami
    const resultEmbed = new EmbedBuilder()
        .setTitle('✅ Wysyłanie zakończone')
        .setColor(failCount > 0 ? 0xFEE75C : 0x57F287)
        .addFields(
            { name: '✅ Wysłane', value: `${successCount}`, inline: true },
            { name: '❌ Niepowodzenia', value: `${failCount}`, inline: true },
            { name: '👥 Rola', value: role.name, inline: false }
        )
        .setTimestamp();

    if (failedUsers.length > 0 && failedUsers.length <= 5) {
        resultEmbed.addFields(
            { name: '⚠️ Niepowodzenia', value: failedUsers.join(', '), inline: false }
        );
    }

    await message.reply({ embeds: [resultEmbed] });
}
