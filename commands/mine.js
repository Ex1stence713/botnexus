import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import * as blocks from '../utils/blocks.js';

export const name = 'mine';
export const description = 'Wydobądź bloki z kopalni!';

export async function execute(message, args) {
    const userId = message.author.id;
    const type = args[0]?.toLowerCase() === 'premium' ? 'premium' : 'normal';
    const economy = (await import('../utils/economy.js')).default;
    
    // Sprawdź cooldown
    const inventory = blocks.getUserInventory(userId);
    if (inventory.lastMine) {
        const now = Date.now();
        const lastMine = new Date(inventory.lastMine).getTime();
        const settings = blocks.getSettings();
        const cooldown = settings.mineCooldown || 5000;
        
        if (now - lastMine < cooldown) {
            const remaining = Math.ceil((cooldown - (now - lastMine)) / 1000);
            const embed = new EmbedBuilder()
                .setTitle('⏳ Cooldown')
                .setDescription(`Musisz poczekać **${remaining} sekund** przed następnym kopaniem!`)
                .setColor(0xED4245)
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '⏱️ Odliczanie', value: `${remaining}s`, inline: true },
                    { name: '💰 Saldo', value: `**${economy.getUser(userId).coins}** 🪙`, inline: true }
                )
                .setFooter({ text: 'Kup lepszy kilof w !blockshop!' });
            return message.reply({ embeds: [embed] });
        }
    }
    
    // Obsługa premium
    if (type === 'premium') {
        const user = economy.getUser(userId);
        if (user.coins < 1000) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Brak środków!')
                .setDescription('Nie masz wystarczająco monet na premium!')
                .setColor(0xED4245)
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '💵 Wymagane', value: '**1,000** 🪙', inline: true },
                    { name: '💰 Posiadasz', value: `**${user.coins}** 🪙`, inline: true }
                )
                .setFooter({ text: 'Zrób !daily żeby zdobyć monety!' });
            return message.reply({ embeds: [embed] });
        }
        economy.removeCoins(userId, 1000);
    }
    
    // Kopanie
    const result = blocks.mineBlock(userId);
    
    if (!result.success) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Błąd!')
            .setDescription(result.message)
            .setColor(0xED4245);
        return message.reply({ embeds: [embed] });
    }
    
    const pickaxe = blocks.getUserPickaxe(userId);
    const totalMined = blocks.getUserInventory(userId).totalMined;
    
    // Kolor zależny od rzadkości bloku
    let blockColor = 0x8B8B8B; // Szary - zwykły
    if (result.block.rarity === 'rare') blockColor = 0x3498DB; // Niebieski
    if (result.block.rarity === 'epic') blockColor = 0x9B59B6; // Fioletowy
    if (result.block.rarity === 'legendary') blockColor = 0xFFD700; // Złoty
    
    const mineEmbed = new EmbedBuilder()
        .setTitle('⛏️ Kopanie zakończone!')
        .setDescription(`${result.message}`)
        .setColor(blockColor)
        .setThumbnail(result.block.icon ? null : message.author.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '🎒 Łącznie wydobyto', value: `**${totalMined}** bloków`, inline: true },
            { name: '🔨 Twój kilof', value: `${pickaxe.icon} ${pickaxe.name}`, inline: true },
            { name: '⭐ Mnożnik', value: `x${pickaxe.multiplier}`, inline: true }
        )
        .addFields(
            { name: '💎 Rzadkość', value: `**${result.block.rarity}**`, inline: true },
            { name: type === 'premium' ? '💎 Premium' : '📦 Typ', value: type === 'premium' ? 'Aktywny (2x)' : 'Normalny', inline: true }
        )
        .setFooter({ text: type === 'premium' ? '💎 Kopanie premium - 2x bloki!' : 'Ulepsz swój kilof w !blockshop!' })
        .setTimestamp();

    // Dodaj dodatkowy blok dla premium
    if (type === 'premium') {
        const extraResult = blocks.mineBlock(userId);
        if (extraResult.success) {
            mineEmbed.addFields(
                { name: '🎁 Bonus premium', value: `+${extraResult.amount}x ${extraResult.block.icon} ${extraResult.block.name}`, inline: false }
            );
        }
    }

    // Dodaj przyciski
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('mine_again')
                .setLabel('⛏️ Kopaj dalej')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('mine_shop')
                .setLabel('🏪 Sklep')
                .setStyle(ButtonStyle.Secondary)
        );

    await message.reply({ embeds: [mineEmbed], components: [row] });
}
