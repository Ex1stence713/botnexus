import { EmbedBuilder } from 'discord.js';

export const name = 'choose';
export const description = 'Losuje jedną z podanych opcji';

export async function execute(message, args) {
    if (args.length < 2) {
        return message.reply('Podaj co najmniej 2 opcje oddzielone spacją! Użycie: !choose opcja1 opcja2 opcja3...');
    }
    
    const options = args;
    const randomIndex = Math.floor(Math.random() * options.length);
    const chosen = options[randomIndex];
    
    const embed = new EmbedBuilder()
        .setTitle('🎯 Losowanie')
        .setColor('#5865F2')
        .addFields(
            { name: '📋 Opcje', value: options.join(', '), inline: false },
            { name: '✅ Wybrano', value: `**${chosen}**`, inline: false }
        )
        .setFooter({ text: `Zapytanie od: ${message.author.tag} • BotNexus` })
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}
