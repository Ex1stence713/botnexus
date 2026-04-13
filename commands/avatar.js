import { EmbedBuilder } from 'discord.js';

export const name = 'avatar';
export const description = 'Wyświetla avatar użytkownika';

export async function execute(message, args) {
    let user = message.author;
    
    if (args.length > 0) {
        const userId = args[0].replace(/<@!/g, '').replace(/<@/g, '').replace(/>/g, '');
        try {
            user = await message.client.users.fetch(userId);
        } catch (e) {
            return message.reply('Nie znaleziono użytkownika!');
        }
    }
    
    const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 1024 });
    
    const embed = new EmbedBuilder()
        .setTitle(`🖼️ Avatar ${user.username}`)
        .setColor(0x5865F2)
        .setImage(avatarUrl)
        .addFields(
            { name: '👤 Użytkownik', value: user.tag, inline: true },
            { name: '🆔 ID', value: user.id, inline: true }
        )
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}
