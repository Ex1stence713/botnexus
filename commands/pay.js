import { EmbedBuilder } from 'discord.js';
import economy from '../utils/economy.js';

export const name = 'pay';
export const description = 'Przelij monety innemu użytkownikowi';

export async function execute(message, args) {
    if (args.length < 2) {
        return message.reply('Podaj użytkownika i ilość! Użycie: !pay <użytkownik> <ilość>');
    }
    
    const senderId = message.author.id;
    
    // Pobierz użytkownika z args
    const userId = args[0].replace(/<@!/g, '').replace(/<@/g, '').replace(/>/g, '');
    let recipient;
    try {
        recipient = await message.client.users.fetch(userId);
    } catch (e) {
        return message.reply('Nie znaleziono użytkownika!');
    }
    
    const amount = parseInt(args[1]);
    
    if (isNaN(amount)) {
        return message.reply('Podaj poprawną liczbę!');
    }
    
    // Walidacja
    if (amount <= 0) {
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Błąd!')
            .setDescription('Ilość monet musi być większa od 0')
            .setColor(0xED4245);
        return message.reply({ embeds: [errorEmbed] });
    }
    
    if (senderId === recipient.id) {
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Błąd!')
            .setDescription('Nie możesz przesłać pieniędzy samemu sobie!')
            .setColor(0xED4245);
        return message.reply({ embeds: [errorEmbed] });
    }
    
    const sender = economy.getUser(senderId);
    
    if (sender.coins < amount) {
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Brak środków!')
            .setDescription(`Masz tylko **${sender.coins}** monet, a próbujesz przesłać **${amount}**`)
            .setColor(0xED4245);
        return message.reply({ embeds: [errorEmbed] });
    }
    
    // Wykonaj przelew
    economy.removeCoins(senderId, amount);
    economy.addCoins(recipient.id, amount);
    
    const senderNew = economy.getUser(senderId);
    const recipientNew = economy.getUser(recipient.id);
    
    const payEmbed = new EmbedBuilder()
        .setTitle('💸 Przelew wykonany!')
        .setDescription(`Pomyślnie przesłano monety`)
        .setColor(0x57F287)
        .setThumbnail(recipient.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '📤 Od', value: message.author.tag, inline: true },
            { name: '📥 Do', value: recipient.tag, inline: true },
            { name: '💰 Kwota', value: `**${amount.toLocaleString()}** monet`, inline: false },
            { name: '💵 Twoje monety', value: `**${senderNew.coins.toLocaleString()}**`, inline: true }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [payEmbed] });
}
