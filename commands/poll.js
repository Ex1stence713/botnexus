import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

export const name = 'poll';
export const description = 'Tworzy ankietę';

export async function execute(message, args) {
    if (args.length < 2) {
        return message.reply('Podaj pytanie i opcje! Użycie: !poll <pytanie> <opcja1;opcja2;...>');
    }
    
    const optionsString = args.slice(1).join(' ');
    const options = optionsString.split(';').map(o => o.trim()).filter(o => o.length > 0);

    if (options.length < 2) {
        return message.reply({ content: '❌ Musisz podać co najmniej 2 opcje oddzielone średnikiem!' });
    }

    if (options.length > 5) {
        return message.reply({ content: '❌ Maksymalnie 5 opcji!' });
    }

    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
    const pollEmbed = new EmbedBuilder()
        .setTitle('📊 Ankieta')
        .setDescription(`**${args[0]}**`)
        .setColor(0x5865F2)
        .setFields(options.map((opt, i) => ({
            name: `${emojis[i]} ${opt}`,
            value: '0 głosów',
            inline: true
        })))
        .setFooter({ text: 'BotNexus • Głosuj klikając poniżej' })
        .setTimestamp();

    const row = new ActionRowBuilder();
    options.forEach((_, i) => {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`poll_${i}`)
                .setLabel(emojis[i])
                .setStyle(ButtonStyle.Primary)
        );
    });

    await message.reply({ embeds: [pollEmbed], components: [row] });
}
