import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const name = 'shop';
export const description = 'Sklep z rolami i nagrodami';

// Konfiguracja sklepu - role dostępne do kupna
const shopItems = [
    { id: 'vip', name: '💎 Rola VIP', price: 5000, description: 'Ekskluzywna rola VIP', category: 'role', roleId: null },
    { id: 'premium', name: '🌟 Rola Premium', price: 10000, description: 'Premium serwera', category: 'role', roleId: null },
    { id: 'booster', name: '🚀 Rola Booster', price: 15000, description: 'Dla boosterów', category: 'role', roleId: null },
    { id: 'legend', name: '👑 Rola Legend', price: 25000, description: 'Najwyższa ranga', category: 'role', roleId: null },
    { id: 'color_red', name: '🔴 Kolor Czerwony', price: 3000, description: 'Kolorowy nick - Czerwony', category: 'kolory', roleId: null },
    { id: 'color_blue', name: '🔵 Kolor Niebieski', price: 3000, description: 'Kolorowy nick - Niebieski', category: 'kolory', roleId: null },
    { id: 'color_green', name: '🟢 Kolor Zielony', price: 3000, description: 'Kolorowy nick - Zielony', category: 'kolory', roleId: null },
    { id: 'color_gold', name: '🟡 Kolor Złoty', price: 5000, description: 'Kolorowy nick - Złoty', category: 'kolory', roleId: null },
    { id: 'title_hunter', name: '🏅 Tytuł: Hunter', price: 7500, description: 'Tytuł przed nickiem', category: 'tytuly', roleId: null },
    { id: 'title_pro', name: '🎖️ Tytuł: Pro', price: 10000, description: 'Tytuł przed nickiem', category: 'tytuly', roleId: null }
];

export async function execute(message, args) {
    const category = args[0]?.toLowerCase();
    
    // Pokaż główne menu
    if (!category || category === 'menu') {
        const menuEmbed = new EmbedBuilder()
            .setTitle('🏪 Sklep Serwera')
            .setDescription('Witaj w sklepie! Wybierz kategorię poniżej.')
            .setColor(0x5865F2)
            .setThumbnail(message.guild?.iconURL({ dynamic: true }))
            .addFields(
                { name: '💎 Role', value: 'VIP, Premium, Booster, Legend', inline: true },
                { name: '🎨 Kolory', value: 'Kolorowe nicki', inline: true },
                { name: '🏅 Tytuły', value: 'Tytuły przed nickiem', inline: true }
            )
            .setFooter({ text: 'Kliknij przycisk kategorii aby zobaczyć przedmioty' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('shop_role')
                    .setLabel('💎 Role')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('shop_kolory')
                    .setLabel('🎨 Kolory')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('shop_tytuly')
                    .setLabel('🏅 Tytuły')
                    .setStyle(ButtonStyle.Secondary)
            );

        return message.reply({ embeds: [menuEmbed], components: [row] });
    }

    // Filtruj po kategorii
    let items = shopItems;
    let categoryName = 'Wszystko';
    let categoryColor = 0x5865F2;
    let emoji = '📦';
    
    if (category === 'role' || category === 'roles') {
        items = shopItems.filter(i => i.category === 'role');
        categoryName = '💎 Role';
        categoryColor = 0xFFD700;
        emoji = '💎';
    } else if (category === 'kolor' || category === 'kolory' || category === 'colors') {
        items = shopItems.filter(i => i.category === 'kolory');
        categoryName = '🎨 Kolory';
        categoryColor = 0x57F287;
        emoji = '🎨';
    } else if (category === 'title' || category === 'tytul' || category === 'titles') {
        items = shopItems.filter(i => i.category === 'tytuly');
        categoryName = '🏅 Tytuły';
        categoryColor = 0xFF6B6B;
        emoji = '🏅';
    }

    // Utwórz listę przedmiotów
    let itemsDescription = '';
    for (const item of items) {
        itemsDescription += `${emoji} **${item.name}**\n`;
        itemsDescription += `   💰 Cena: **${item.price.toLocaleString()}** monet\n`;
        itemsDescription += `   📝 ${item.description}\n`;
        itemsDescription += `   🔹 Użyj: \`!buy ${item.id}\`\n\n`;
    }

    const shopEmbed = new EmbedBuilder()
        .setTitle(`${emoji} ${categoryName}`)
        .setDescription(itemsDescription)
        .setColor(categoryColor)
        .setThumbnail(message.guild?.iconURL({ dynamic: true }))
        .setFooter({ text: 'Użyj !buy <id> aby kupić przedmiot' })
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('shop_back')
                .setLabel('⬅️ Wróć')
                .setStyle(ButtonStyle.Secondary)
        );

    await message.reply({ embeds: [shopEmbed], components: [row] });
}

// Exportuj listę przedmiotów dla komendy buy
export { shopItems };
