import { EmbedBuilder } from 'discord.js';
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
                .setColor(0xe74c3c)
                .setDescription(`⏳ Musisz poczekać **${remaining} sekund** przed następnym kopaniem!`);
            return message.reply({ embeds: [embed] });
        }
    }
    
    // Obsługa premium
    if (type === 'premium') {
        const user = economy.getUser(userId);
        if (user.coins < 1000) {
            const embed = new EmbedBuilder()
                .setColor(0xe74c3c)
                .setDescription('❌ Nie masz wystarczająco monet na premium! Potrzebujesz 1000 🪙');
            return message.reply({ embeds: [embed] });
        }
        economy.removeCoins(userId, 1000);
    }
    
    // Kopanie
    const result = blocks.mineBlock(userId);
    
    if (!result.success) {
        const embed = new EmbedBuilder()
            .setColor(0xe74c3c)
            .setDescription(`❌ ${result.message}`);
        return message.reply({ embeds: [embed] });
    }
    
    const pickaxe = blocks.getUserPickaxe(userId);
    const totalMined = blocks.getUserInventory(userId).totalMined;
    
    const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle('⛏️ Kopanie zakończone!')
        .setDescription(result.message)
        .addFields(
            { name: '🎒 Łącznie wydobyto', value: `${totalMined} bloków`, inline: true },
            { name: '🔨 Twój kilof', value: `${pickaxe.icon} ${pickaxe.name}`, inline: true },
            { name: '⭐ Mnożnik', value: `x${pickaxe.multiplier}`, inline: true }
        )
        .setFooter({ text: type === 'premium' ? '💎 Kopanie premium - 2x bloki!' : 'Ulepsz swój kilof w !blockshop!' })
        .setTimestamp();
    
    // Jeśli premium, dodaj dodatkowy blok
    if (type === 'premium') {
        const extraResult = blocks.mineBlock(userId);
        if (extraResult.success) {
            embed.addFields(
                { name: '🎁 Bonus premium', value: `+${extraResult.amount}x ${extraResult.block.icon} ${extraResult.block.name}`, inline: false }
            );
        }
    }
    
    await message.reply({ embeds: [embed] });
}
