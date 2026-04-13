import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export const name = 'clear';
export const description = 'Czyści wiadomości';

export async function execute(message, args) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return message.reply('Nie masz uprawnień do zarządzania wiadomościami!');
    }
    
    if (args.length === 0) {
        return message.reply('Podaj ilość wiadomości! Użycie: !clear <ilość>');
    }
    
    const amount = parseInt(args[0]);
    
    if (isNaN(amount) || amount < 1 || amount > 100) {
        return message.reply('Podaj liczbę od 1 do 100!');
    }
    
    try {
        await message.channel.bulkDelete(amount, true);
        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('🧹 Wiadomości usunięte')
            .addFields(
                { name: '📊 Ilość', value: `${amount} wiadomości`, inline: true },
                { name: '🛡️ Moderator', value: message.author.tag, inline: true }
            )
            .setFooter({ text: 'BotNexus' })
            .setTimestamp();
        await message.reply({ embeds: [embed] });
    } catch (err) {
        const embed = new EmbedBuilder()
            .setColor(0xED4245)
            .setDescription(`❌ Błąd: ${err.message}`);
        await message.reply({ embeds: [embed] });
    }
}
