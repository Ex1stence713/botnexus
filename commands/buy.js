import { EmbedBuilder } from 'discord.js';
import economy from '../utils/economy.js';
import { shopItems } from './shop.js';

export const name = 'buy';
export const description = 'Kup przedmiot ze sklepu';

export async function execute(message, args) {
    if (args.length === 0) {
        return message.reply('Podaj ID przedmiotu! Użycie: !buy <id> [ilość]');
    }
    
    const itemId = args[0].toLowerCase();
    const quantity = parseInt(args[1]) || 1;
    
    // Znajdź przedmiot
    const item = shopItems.find(i => i.id.toLowerCase() === itemId);
    
    if (!item) {
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Nie znaleziono przedmiotu!')
            .setDescription(`Nie ma przedmiotu z ID \`${itemId}\`\nSprawdź listę w \`!shop\``)
            .setColor(0xED4245);
        return message.reply({ embeds: [errorEmbed] });
    }
    
    const userId = message.author.id;
    const totalPrice = item.price * quantity;
    const user = economy.getUser(userId);
    
    if (user.coins < totalPrice) {
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Brak środków!')
            .setDescription(`Potrzebujesz **${totalPrice.toLocaleString()}** monet, a masz **${user.coins.toLocaleString()}**`)
            .setColor(0xED4245);
        return message.reply({ embeds: [errorEmbed] });
    }
    
    // Sprawdź czy użytkownik już nie ma tego przedmiotu (dla ról/kolorów)
    if (user.inventory.includes(item.name)) {
        const errorEmbed = new EmbedBuilder()
            .setTitle('⚠️ Już posiadasz!')
            .setDescription(`Masz już **${item.name}**`)
            .setColor(0xFEE75C);
        return message.reply({ embeds: [errorEmbed] });
    }
    
    // Kup przedmiot
    economy.removeCoins(userId, totalPrice);
    economy.addItem(userId, item.name);
    
    const buyEmbed = new EmbedBuilder()
        .setTitle('✅ Zakup udany!')
        .setDescription(`Kupiłeś **${quantity}x ${item.name}**`)
        .setColor(0x57F287)
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '🛒 Przedmiot', value: item.name, inline: true },
            { name: '💰 Zapłacono', value: `**${totalPrice.toLocaleString()}** monet`, inline: true },
            { name: '💵 Pozostałe monety', value: `**${(user.coins - totalPrice).toLocaleString()}**`, inline: false }
        )
        .setFooter({ text: 'Przedmiot dodany do ekwipunku!' })
        .setTimestamp();
    
    // Jeśli item ma roleId, nadaj rolę (opcjonalnie)
    if (item.roleId && message.guild) {
        try {
            const role = message.guild.roles.cache.get(item.roleId);
            if (role && message.member) {
                await message.member.roles.add(role);
                buyEmbed.addFields({ name: '🎉 Rola dodana!', value: `Otrzymałeś rolę ${role.name}`, inline: false });
            }
        } catch (err) {
            console.error('Błąd nadawania roli:', err);
        }
    }
    
    await message.reply({ embeds: [buyEmbed] });
}
