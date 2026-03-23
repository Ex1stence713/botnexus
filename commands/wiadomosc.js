import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export const name = 'dm';
export const description = 'Wyślij prywatną wiadomość do wybranego użytkownika.';

export async function execute(message, args) {
    const ownerId = process.env.BOT_OWNER_ID;
    const isOwner = message.author.id === ownerId;
    const hasPerm = message.member?.permissions?.has?.(PermissionFlagsBits.ManageGuild);

    if (!isOwner && !hasPerm) {
        return message.reply('Nie masz uprawnień do użycia tej komendy.');
    }
    
    if (args.length < 2) {
        return message.reply('Podaj użytkownika i wiadomość! Użycie: !dm <@użytkownik> <wiadomość>');
    }
    
    if (!message.guild) {
        return message.reply('Ta komenda działa tylko na serwerze!');
    }
    
    // Pobierz pierwszy argument jako użytkownika (mention lub ID)
    const userArg = args[0];
    let targetUser = null;
    
    // Obsłuż mention użytkownika (<@!ID> lub <@ID>)
    const mentionMatch = userArg.match(/^<@!?(\d+)>$/);
    if (mentionMatch) {
        const userId = mentionMatch[1];
        targetUser = message.guild.members.cache.get(userId)?.user || await message.client.users.fetch(userId).catch(() => null);
    } else if (/^\d+$/.test(userArg)) {
        // ID użytkownika
        targetUser = message.guild.members.cache.get(userArg)?.user || await message.client.users.fetch(userArg).catch(() => null);
    }
    
    if (!targetUser) {
        return message.reply('Nie znaleziono takiego użytkownika!');
    }
    
    const text = args.slice(1).join(' ');
    
    // Prosta ochrona przed nadużyciem (limit długości)
    if (text.length > 2000) {
        return message.reply('Wiadomość jest za długa — max 2000 znaków.');
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

    // Wysyłanie wiadomości do użytkownika
    try {
        const user = await targetUser.createDM();
        await user.send({ embeds: [dmEmbed] });
        
        // Log
        console.log(`Wiadomość wysłana do użytkownika ${targetUser.tag} przez ${message.author.tag}`);

        // Embed z wynikami
        const resultEmbed = new EmbedBuilder()
            .setTitle('✅ Wiadomość wysłana')
            .setColor(0x57F287)
            .addFields(
                { name: '👤 Odbiorca', value: targetUser.tag, inline: true },
                { name: '📝 Treść', value: text.substring(0, 100) + (text.length > 100 ? '...' : ''), inline: false }
            )
            .setTimestamp();

        await message.reply({ embeds: [resultEmbed] });
    } catch (err) {
        console.error(`Błąd przy wysyłaniu DM do ${targetUser.tag}:`, err);
        await message.reply(`❌ Nie udało się wysłać wiadomości do ${targetUser.tag}. Użytkownik może mieć zablokowane DM.`);
    }
}
