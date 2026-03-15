import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import economy from '../utils/economy.js';

export const data = new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Przelij monety innemu użytkownikowi')
    .addUserOption(opt => opt.setName('user').setDescription('Użytkownik').setRequired(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Ilość monet').setRequired(true));

export async function execute(interaction) {
    const senderId = interaction.user.id;
    const recipient = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    
    // Walidacja
    if (amount <= 0) {
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Błąd!')
            .setDescription('Ilość monet musi być większa od 0')
            .setColor(0xED4245);
        return interaction.reply({ embeds: [errorEmbed] });
    }
    
    if (senderId === recipient.id) {
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Błąd!')
            .setDescription('Nie możesz przesłać pieniędzy samemu sobie!')
            .setColor(0xED4245);
        return interaction.reply({ embeds: [errorEmbed] });
    }
    
    const sender = economy.getUser(senderId);
    
    if (sender.coins < amount) {
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Brak środków!')
            .setDescription(`Masz tylko **${sender.coins}** monet, a próbujesz przesłać **${amount}**`)
            .setColor(0xED4245);
        return interaction.reply({ embeds: [errorEmbed] });
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
            { name: '📤 Od', value: interaction.user.tag, inline: true },
            { name: '📥 Do', value: recipient.tag, inline: true },
            { name: '💰 Kwota', value: `**${amount.toLocaleString()}** monet`, inline: false },
            { name: '💵 Twoje monety', value: `**${senderNew.coins.toLocaleString()}**`, inline: true }
        )
        .setTimestamp();
    
    await interaction.reply({ embeds: [payEmbed] });
}
