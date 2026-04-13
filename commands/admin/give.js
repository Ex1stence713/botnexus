import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import economy from '../utils/economy.js';

export const name = 'give';
export const description = 'Daj monety użytkownikowi (admin only)';

export async function execute(message, args) {
    // Sprawdź uprawnienia
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply('❌ Ta komenda wymaga uprawnień administratora!');
    }

    if (args.length < 2) {
        return message.reply('Podaj użytkownika i ilość! Użycie: !give <użytkownik> <ilość>');
    }

    // Pobierz użytkownika z args
    const userId = args[0].replace(/<@!/g, '').replace(/<@/g, '').replace(/>/g, '');
    let targetUser;
    try {
        targetUser = await message.client.users.fetch(userId);
    } catch (e) {
        return message.reply('❌ Nie znaleziono użytkownika!');
    }

    const amount = parseInt(args[1]);

    if (isNaN(amount) || amount <= 0) {
        return message.reply('❌ Podaj poprawną dodatnią liczbę!');
    }

    // Dodaj monety
    economy.addCoins(targetUser.id, amount);
    const userData = economy.getUser(targetUser.id);

    const embed = new EmbedBuilder()
        .setTitle('✅ Monety wydane!')
        .setDescription(`Dodano monety użytkownikowi`)
        .setColor(0x57F287)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '📥 Odbiorca', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
            { name: '💰 Kwota', value: `**+${amount.toLocaleString()}** 🪙`, inline: true },
            { name: '💵 Nowe saldo', value: `**${userData.coins.toLocaleString()}** 🪙`, inline: false }
        )
        .setFooter({ text: `Przez: ${message.author.tag}` })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
}
