import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const name = 'help';
export const description = 'Wyświetla listę wszystkich komend.';

export async function execute(message, args) {
    // Podziel komendy na kategorie
    const categories = {
        '📚 Ogólne': [],
        '💰 Ekonomia': [],
        '🎮 Gry': [],
        '🛡️ Admin': []
    };

    // Przypisz komendy do kategorii
    const economyCommands = ['balance', 'daily', 'gamble', 'shop', 'buy', 'pay', 'mine', 'leaderboard', 'lowrybe'];
    const gameCommands = ['joke', 'poll', 'ankieta', 'ticket', '8ball', 'roll', 'flip', 'choose', 'ship', 'roast', 'compliment', 'rate', 'calc', 'password', 'quote', 'fact', 'color', 'trivia', 'profil', 'statystyki'];
    const adminCommands = ['ban', 'kick', 'clear', 'mute', 'unmute', 'warn', 'timeout', 'unban', 'lock', 'unlock', 'slowmode', 'control', 'restart', 'automod', 'przypomnij-admin', 'announce', 'changelog', 'dmall', 'dm', 'nadajrole', 'dajrange', 'regulamin'];
    
    const allCommands = message.client.commands;
    
    for (const [name, cmd] of allCommands) {
        if (adminCommands.includes(name)) {
            categories['🛡️ Admin'].push(cmd);
        } else if (economyCommands.includes(name)) {
            categories['💰 Ekonomia'].push(cmd);
        } else if (gameCommands.includes(name)) {
            categories['🎮 Gry'].push(cmd);
        } else {
            categories['📚 Ogólne'].push(cmd);
        }
    }

    // Utwórz przyciski kategorii
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('help_general')
                .setLabel('📚 Ogólne')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('help_economy')
                .setLabel('💰 Ekonomia')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('help_games')
                .setLabel('🎮 Gry')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('help_admin')
                .setLabel('🛡️ Admin')
                .setStyle(ButtonStyle.Danger)
        );

    // Utwórz główny embed
    const helpEmbed = new EmbedBuilder()
        .setTitle('📚 Pomoc Bota')
        .setDescription('Witaj! Użyj poniższych przycisków aby zobaczyć komendy w danej kategorii.')
        .setColor(0x5865F2)
        .setThumbnail(message.client.user.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '📚 Ogólne', value: `${categories['📚 Ogólne'].length} komend`, inline: true },
            { name: '💰 Ekonomia', value: `${categories['💰 Ekonomia'].length} komend`, inline: true },
            { name: '🎮 Gry', value: `${categories['🎮 Gry'].length} komend`, inline: true },
            { name: '🛡️ Admin', value: `${categories['🛡️ Admin'].length} komend`, inline: true }
        )
        .setFooter({ text: 'BotNexus • Wersja 1.0' })
        .setTimestamp();

    await message.reply({ embeds: [helpEmbed], components: [row] });

    // Funkcja do wyświetlania kategorii
    async function showCategory(categoryName, categoryKey) {
        const cmds = categories[categoryName];
        const cmdList = cmds.map(cmd => `**!${cmd.name}** — ${cmd.description || 'brak opisu'}`).join('\n');
        
        const categoryEmbed = new EmbedBuilder()
            .setTitle(`${categoryName} - Komendy`)
            .setDescription(cmdList || 'Brak komend w tej kategorii')
            .setColor(categoryName === '🛡️ Admin' ? 0xED4245 : (categoryName === '💰 Ekonomia' ? 0xFEE75C : 0x5865F2))
            .setFooter({ text: 'Użyj !help żeby wrócić do menu' })
            .setTimestamp();

        // Wyczyść poprzednie przyciski i wyślij nowe
        const newRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('help_back')
                    .setLabel('⬅️ Wróć')
                    .setStyle(ButtonStyle.Secondary)
            );

        await message.channel.send({ embeds: [categoryEmbed], components: [newRow] });
    }

    // Obsługa przycisków ( collector)
    const filter = i => i.user.id === message.author.id;
    const collector = message.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async i => {
        if (i.customId === 'help_general') {
            await showCategory('📚 Ogólne', 'general');
        } else if (i.customId === 'help_economy') {
            await showCategory('💰 Ekonomia', 'economy');
        } else if (i.customId === 'help_games') {
            await showCategory('🎮 Gry', 'games');
        } else if (i.customId === 'help_admin') {
            await showCategory('🛡️ Admin', 'admin');
        } else if (i.customId === 'help_back') {
            await message.reply({ embeds: [helpEmbed], components: [row] });
        }
        await i.deferUpdate();
    });
}
