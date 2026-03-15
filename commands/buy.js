import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import economy from '../utils/economy.js';
import { shopItems } from './shop.js';

export const data = new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Kup przedmiot ze sklepu')
    .addStringOption(opt => opt.setName('id').setDescription('ID przedmiotu (sprawdź w /shop)').setRequired(true))
    .addIntegerOption(opt => opt.setName('ilosc').setDescription('Ilość (dla przedmiotów)').setRequired(false));

export async function execute(interaction) {
    const userId = interaction.user.id;
    const itemId = interaction.options.getString('id').toLowerCase();
    const quantity = interaction.options.getInteger('ilosc') || 1;
    
    // Znajdź przedmiot
    const item = shopItems.find(i => i.id.toLowerCase() === itemId);
    
    if (!item) {
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Nie znaleziono przedmiotu!')
            .setDescription(`Nie ma przedmiotu z ID \`${itemId}\`\nSprawdź listę w \`/shop\``)
            .setColor(0xED4245);
        return interaction.reply({ embeds: [errorEmbed] });
    }
    
    const totalPrice = item.price * quantity;
    const user = economy.getUser(userId);
    
    if (user.coins < totalPrice) {
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Brak środków!')
            .setDescription(`Potrzebujesz **${totalPrice.toLocaleString()}** monet, a masz **${user.coins.toLocaleString()}**`)
            .setColor(0xED4245);
        return interaction.reply({ embeds: [errorEmbed] });
    }
    
    // Sprawdź czy użytkownik już nie ma tego przedmiotu (dla ról/kolorów)
    if (user.inventory.includes(item.name)) {
        const errorEmbed = new EmbedBuilder()
            .setTitle('⚠️ Już posiadasz!')
            .setDescription(`Masz już **${item.name}**`)
            .setColor(0xFEE75C);
        return interaction.reply({ embeds: [errorEmbed] });
    }
    
    // Kup przedmiot
    economy.removeCoins(userId, totalPrice);
    economy.addItem(userId, item.name);
    
    const buyEmbed = new EmbedBuilder()
        .setTitle('✅ Zakup udany!')
        .setDescription(`Kupiłeś **${quantity}x ${item.name}**`)
        .setColor(0x57F287)
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '🛒 Przedmiot', value: item.name, inline: true },
            { name: '💰 Zapłacono', value: `**${totalPrice.toLocaleString()}** monet`, inline: true },
            { name: '💵 Pozostałe monety', value: `**${(user.coins - totalPrice).toLocaleString()}**`, inline: false }
        )
        .setFooter({ text: 'Przedmiot dodany do ekwipunku!' })
        .setTimestamp();
    
    // Jeśli item ma roleId, nadaj rolę (opcjonalnie)
    if (item.roleId) {
        try {
            const role = interaction.guild.roles.cache.get(item.roleId);
            if (role) {
                await interaction.member.roles.add(role);
                buyEmbed.addFields({ name: '🎉 Rola dodana!', value: `Otrzymałeś rolę ${role.name}`, inline: false });
            }
        } catch (err) {
            console.error('Błąd nadawania roli:', err);
        }
    }
    
    await interaction.reply({ embeds: [buyEmbed] });
}
