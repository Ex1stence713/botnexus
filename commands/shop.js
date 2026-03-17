import { EmbedBuilder } from 'discord.js';

export const name = 'shop';
export const description = 'Sklep z rolami i nagrodami';

// Konfiguracja sklepu - role dostępne do kupna
const shopItems = [
    { id: 'vip', name: '💎 Rola VIP', price: 5000, description: 'Ekskluzywna rola VIP', roleId: null },
    { id: 'premium', name: '🌟 Rola Premium', price: 10000, description: 'Premium serwera', roleId: null },
    { id: 'booster', name: '🚀 Rola Booster', price: 15000, description: 'Dla boosterów', roleId: null },
    { id: 'legend', name: '👑 Rola Legend', price: 25000, description: 'Najwyższa ranga', roleId: null },
    { id: 'color_red', name: '🔴 Kolor Czerwony', price: 3000, description: 'Kolorowy nick - Czerwony', roleId: null },
    { id: 'color_blue', name: '🔵 Kolor Niebieski', price: 3000, description: 'Kolorowy nick - Niebieski', roleId: null },
    { id: 'color_green', name: '🟢 Kolor Zielony', price: 3000, description: 'Kolorowy nick - Zielony', roleId: null },
    { id: 'color_gold', name: '🟡 Kolor Złoty', price: 5000, description: 'Kolorowy nick - Złoty', roleId: null },
    { id: 'title_hunter', name: '🏅 Tytuł: Hunter', price: 7500, description: 'Tytuł przed nickiem', roleId: null },
    { id: 'title_pro', name: '🎖️ Tytuł: Pro', price: 10000, description: 'Tytuł przed nickiem', roleId: null }
];

export async function execute(message, args) {
    const category = args[0]?.toLowerCase();
    
    let items = shopItems;
    if (category === 'role' || category === 'roles') {
        items = shopItems.filter(i => i.id.includes('vip') || i.id.includes('premium') || i.id.includes('booster') || i.id.includes('legend'));
    } else if (category === 'kolor' || category === 'kolory' || category === 'colors') {
        items = shopItems.filter(i => i.id.includes('color'));
    } else if (category === 'title' || category === 'tytul' || category === 'titles') {
        items = shopItems.filter(i => i.id.includes('title'));
    }
    
    const guild = message.guild;
    
    const shopEmbed = new EmbedBuilder()
        .setTitle('🏪 Sklep serwera')
        .setDescription('Kup role i nagrody używając komendy `!buy <id>`')
        .setColor(0x5865F2)
        .setThumbnail(guild?.iconURL({ dynamic: true }));
    
    // Dodaj pola z przedmiotami
    for (const item of items) {
        shopEmbed.addFields({
            name: `${item.name} - ${item.price.toLocaleString()} 💰`,
            value: `ID: \`${item.id}\`\n${item.description}`,
            inline: false
        });
    }
    
    shopEmbed.setFooter({ text: 'Użyj !buy <id> aby kupić przedmiot' });
    shopEmbed.setTimestamp();
    
    await message.reply({ embeds: [shopEmbed] });
}

// Exportuj listę przedmiotów dla komendy buy
export { shopItems };
