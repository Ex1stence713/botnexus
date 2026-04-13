import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const name = 'quickpoll';
export const description = 'Szybka ankieta (tak/nie)';

export async function execute(message, args) {
    if (args.length === 0) {
        return message.reply('Podaj pytanie! Użycie: !quickpoll <pytanie>');
    }
    
    const question = args.join(' ');
    
    const embed = new EmbedBuilder()
        .setTitle('📊 Szybka ankieta')
        .setColor(0x5865F2)
        .setDescription(question)
        .setFooter({ text: `Ankieta od: ${message.author.tag} • BotNexus` })
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('poll_yes')
                .setLabel('✅ Tak')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('poll_no')
                .setLabel('❌ Nie')
                .setStyle(ButtonStyle.Danger)
        );

    const pollMessage = await message.reply({ embeds: [embed], components: [row] });

    const collector = pollMessage.createMessageComponentCollector({ time: 86400000 });
    
    collector.on('collect', async i => {
        await i.reply({ content: `Głos oddany!`, ephemeral: true });
    });
}