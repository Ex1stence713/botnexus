import { EmbedBuilder } from 'discord.js';

export const name = 'help';
export const description = 'Wyświetla listę wszystkich komend.';

export async function execute(message, args) {
    const commands = Array.from(message.client.commands.values());
    const categories = {};

    for (const cmd of commands) {
        const cat = message.client.categoryMap?.get(cmd.name) || 'general';
        if (!categories[cat]) categories[cat] = [];
        const desc = cmd.description || '';
        // format as `!name — description`
        categories[cat].push(`!${cmd.name} — ${desc}`);
    }

    const helpEmbed = new EmbedBuilder()
        .setTitle('📚 Wszystkie Komendy Bota')
        .setDescription('Poniżej znajdziesz listę wszystkich dostępnych komend.')
        .setColor(0x5865F2);

    for (const [cat, list] of Object.entries(categories)) {
        let title = '🌐 Komendy Ogólne';
        if (cat.toLowerCase() === 'admin') title = '🛡️ Komendy Administracyjne';
        else if (cat.toLowerCase() === 'info') title = 'ℹ️ Komendy Informacyjne';

        helpEmbed.addFields({ name: title, value: list.join('\n') || 'Brak komend', inline: false });
    }

    helpEmbed.setFooter({ text: 'Wersja 1.0 • Aby uzyskać więcej informacji o danej komendzie, użyj !help' })
        .setTimestamp();

    await message.reply({ embeds: [helpEmbed] });
}
