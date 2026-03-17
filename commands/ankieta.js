import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const name = 'ankieta';
export const description = 'Tworzy profesjonalną ankietę z przyciskami';

export async function execute(message, args) {
    if (args.length < 3) {
        return message.reply('Podaj pytanie i dwie opcje! Użycie: !ankieta <pytanie> <opcja1> <opcja2>');
    }
    
    const question = args[0];
    const opt1 = args[1];
    const opt2 = args.slice(2).join(' ');

    const embed = new EmbedBuilder()
        .setTitle('📊 Głosowanie')
        .setDescription(`**${question}**\n\n🟦: ${opt1}\n🟥: ${opt2}`)
        .setColor('#5865F2')
        .setFooter({ text: `Ankieta rozpoczęta przez: ${message.author.tag}` });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('poll_1').setLabel(opt1).setStyle(ButtonStyle.Primary).setEmoji('🟦'),
        new ButtonBuilder().setCustomId('poll_2').setLabel(opt2).setStyle(ButtonStyle.Danger).setEmoji('🟥')
    );

    await message.reply({ embeds: [embed], components: [row] });
}
