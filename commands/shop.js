import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

// Konfiguracja sklepu - role dostępne do kupna
const shopItems = [
    { id: 'vip', name: '💎 Rola VIP', price: 5000, description: 'Ekskluzywna rola VIP', roleId: null }, // roleId ustaw w config
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

export const data = new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Sklep z rolami i nagrodami')
    .addStringOption(opt => opt.setName('kategoria').setDescription('Filtruj po kategorii')
        .addChoices(
            { name: 'Role', value: 'roles' },
            { name: 'Kolory', value: 'colors' },
            { name: 'Tytuły', value: 'titles' }
        ).setRequired(false));

export async function execute(interaction) {
    const category = interaction.options.getString('kategoria');
    
    let items = shopItems;
    if (category === 'roles') {
        items = shopItems.filter(i => i.id.includes('vip') || i.id.includes('premium') || i.id.includes('booster') || i.id.includes('legend'));
    } else if (category === 'colors') {
        items = shopItems.filter(i => i.id.includes('color'));
    } else if (category === 'titles') {
        items = shopItems.filter(i => i.id.includes('title'));
    }
    
    const shopEmbed = new EmbedBuilder()
        .setTitle('🏪 Sklep serwera')
        .setDescription('Kup role i nagrody używając komendy `/buy <id>`')
        .setColor(0x5865F2)
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }));
    
    // Dodaj pola z przedmiotami
    for (const item of items) {
        shopEmbed.addFields({
            name: `${item.name} - ${item.price.toLocaleString()} 💰`,
            value: `ID: \`${item.id}\`\n${item.description}`,
            inline: false
        });
    }
    
    shopEmbed.setFooter({ text: 'Użyj /buy <id> aby kupić przedmiot' });
    shopEmbed.setTimestamp();
    
    await interaction.reply({ embeds: [shopEmbed] });
}

// Exportuj listę przedmiotów dla komendy buy
export { shopItems };
