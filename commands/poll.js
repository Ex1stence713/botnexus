import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapa aktywnych ankiet
const activePolls = new Map();

export const name = 'poll';
export const description = 'Tworzy rozbudowaną ankietę z wynikami';

export async function execute(message, args) {
    // Format: !poll "pytanie" "opcja1" "opcja2" ...
    if (args.length < 3) {
        return message.reply(`📊 **Tworzenie ankiety**

Użycie: \`!poll <pytanie> <opcja1> <opcja2> [opcja3]...\`

Przykład:
\`!poll "Kto wygra mecz?" "Drużyna A" "Drużyna B" "Remis"\`

Możesz też użyć:
- \`!poll live <pytanie> <opcja1> <opcja2>\` - ankieta z wynikami na żywo
- \`!poll list\` - lista aktywnych ankiet
- \`!poll end <id>\` - zakończ ankietę`);
    }

    // Sprawdź podkomendy
    if (args[0].toLowerCase() === 'list') {
        const polls = Array.from(activePolls.values());
        
        if (polls.length === 0) {
            return message.reply('❌ Brak aktywnych ankiet!');
        }
        
        const embed = new EmbedBuilder()
            .setTitle('📊 Aktywne ankiety')
            .setColor(0x5865F2)
            .setDescription(polls.map((p, i) => `**${i + 1}.** ${p.question} (${p.totalVotes} głosów)`).join('\n'))
            .setFooter({ text: `Łącznie: ${polls.length} ankiet` });
        
        return message.reply({ embeds: [embed] });
    }
    
    if (args[0].toLowerCase() === 'end') {
        const pollId = args[1];
        const poll = activePolls.get(pollId);
        
        if (!poll) {
            return message.reply('❌ Ankieta o podanym ID nie istnieje!');
        }
        
        // Pokaż wyniki
        let resultsText = '';
        const maxVotes = Math.max(...Object.values(poll.votes));
        
        for (const [option, votes] of Object.entries(poll.votes)) {
            const percentage = poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0;
            const barLength = Math.round((percentage / 100) * 10);
            const bar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);
            resultsText += `**${option}**: ${votes} głosów (${percentage}%)\n${bar}\n\n`;
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`📊 Wyniki ankiety: ${poll.question}`)
            .setColor(0x57F287)
            .setDescription(resultsText)
            .addFields(
                { name: '📈 Łącznie głosów', value: `${poll.totalVotes}`, inline: true },
                { name: '👥 Głosujący', value: `${poll.voters.size}`, inline: true }
            )
            .setFooter({ text: `Ankieta zakończona • BotNexus` })
            .setTimestamp();
        
        activePolls.delete(pollId);
        
        return message.reply({ embeds: [embed] });
    }

    // Sprawdź czy to jest "live" poll
    const isLive = args[0].toLowerCase() === 'live';
    const startIndex = isLive ? 1 : 0;
    
    // Parsuj argumenty
    let question = '';
    const options = [];
    
    // Łącz argumenty w pytanie i opcje
    let currentArg = startIndex;
    
    // Znajdź pierwszy cudzysłów - to będzie pytanie
    let inQuote = false;
    let currentText = '';
    
    for (let i = startIndex; i < args.length; i++) {
        const arg = args[i];
        
        if (arg.startsWith('"') && !inQuote) {
            inQuote = true;
            currentText = arg.slice(1);
        } else if (arg.endsWith('"') && inQuote) {
            currentText += ' ' + arg.slice(0, -1);
            // To jest koniec pytania
            question = currentText;
            inQuote = false;
            currentText = '';
        } else if (inQuote) {
            currentText += ' ' + arg;
        } else if (currentText && !inQuote && arg) {
            // To jest opcja
            options.push(arg);
            currentText = '';
        }
    }
    
    // Alternatywne parsowanie - jeśli nie ma cudzysłowów
    if (!question && args.length >= 3) {
        question = args[startIndex];
        for (let i = startIndex + 1; i < args.length; i++) {
            options.push(args[i]);
        }
    }

    if (options.length < 2) {
        return message.reply('❌ Musisz podać co najmniej 2 opcje!');
    }

    if (options.length > 10) {
        return message.reply('❌ Maksymalnie 10 opcji!');
    }

    const pollId = `poll_${Date.now()}`;
    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

    // Utwórz przyciski dla każdej opcji
    const row = new ActionRowBuilder();
    options.forEach((option, index) => {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`poll_${pollId}_${index}`)
                .setLabel(`${emojis[index]} ${option}`)
                .setStyle(ButtonStyle.Primary)
        );
    });

    // Dodaj przycisk wyników dla live poll
    if (isLive) {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`poll_${pollId}_results`)
                .setLabel('📊 Wyniki')
                .setStyle(ButtonStyle.Secondary)
        );
    }

    // Utwórz embed ankiety
    const pollEmbed = new EmbedBuilder()
        .setTitle(`📊 ${isLive ? '📢' : '📋'} Ankieta: ${question}`)
        .setDescription(`**Opcje:**\n${options.map((opt, i) => `${emojis[i]} ${opt}`).join('\n')}`)
        .setColor(isLive ? 0xFF6B6B : 0x5865F2)
        .addFields(
            { name: '👥 Głosów', value: '0', inline: true },
            { name: isLive ? '⏱️ Live' : '⏳ Zakończ', value: isLive ? 'Tak' : 'Nie', inline: true }
        )
        .setFooter({ text: `ID: ${pollId} • Kliknij przycisk aby głosować` })
        .setTimestamp();

    const sentMessage = await message.reply({ embeds: [pollEmbed], components: [row] });

    // Zapisz ankietę jako aktywną
    activePolls.set(pollId, {
        id: pollId,
        question,
        options,
        votes: options.reduce((acc, opt) => ({ ...acc, [opt]: 0 }), {}),
        voters: new Set(),
        totalVotes: 0,
        messageId: sentMessage.id,
        channelId: message.channel.id,
        isLive,
        createdAt: Date.now()
    });

    // Obsługa głosów
    const filter = i => i.customId.startsWith(`poll_${pollId}`);
    const collector = sentMessage.createMessageComponentCollector({ filter, time: isLive ? 0 : 24 * 60 * 60 * 1000 });

    collector.on('collect', async i => {
        const poll = activePolls.get(pollId);
        if (!poll) return;

        if (i.customId === `poll_${pollId}_results`) {
            // Pokaż wyniki
            let resultsText = '';
            const maxVotes = Math.max(...Object.values(poll.votes));
            
            for (const [option, votes] of Object.entries(poll.votes)) {
                const percentage = poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0;
                const barLength = Math.round((percentage / 100) * 10);
                const bar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);
                resultsText += `**${option}**: ${votes} głosów\n${bar} ${percentage}%\n\n`;
            }
            
            const resultsEmbed = new EmbedBuilder()
                .setTitle(`📊 Wyniki ankiety: ${poll.question}`)
                .setColor(0x57F287)
                .setDescription(resultsText)
                .addFields(
                    { name: '📈 Łącznie głosów', value: `${poll.totalVotes}`, inline: true }
                )
                .setFooter({ text: `BotNexus` })
                .setTimestamp();
            
            return i.reply({ embeds: [resultsEmbed], ephemeral: true });
        }

        // Sprawdź czy użytkownik już głosował
        if (poll.voters.has(i.user.id)) {
            return i.reply({ content: '❌ Już głosowałeś w tej ankiecie!', ephemeral: true });
        }

        // Dodaj głos
        const optionIndex = parseInt(i.customId.split('_').pop());
        const votedOption = poll.options[optionIndex];
        
        poll.votes[votedOption]++;
        poll.voters.add(i.user.id);
        poll.totalVotes++;

        // Zaktualizuj embed
        const pollEmbed = new EmbedBuilder()
            .setTitle(`📊 ${poll.isLive ? '📢' : '📋'} Ankieta: ${poll.question}`)
            .setDescription(`**Opcje:**\n${poll.options.map((opt, idx) => {
                const votes = poll.votes[opt];
                const indicator = idx === optionIndex ? ' ✅' : '';
                return `${emojis[idx]} ${opt}${indicator}`;
            }).join('\n')}`)
            .setColor(poll.isLive ? 0xFF6B6B : 0x5865F2)
            .addFields(
                { name: '👥 Głosów', value: `${poll.totalVotes}`, inline: true },
                { name: poll.isLive ? '⏱️ Live' : '⏳ Zakończ', value: poll.isLive ? 'Tak' : 'Nie', inline: true }
            )
            .setFooter({ text: `ID: ${pollId} • Głos oddany!` })
            .setTimestamp();

        await i.message.edit({ embeds: [pollEmbed] });
        await i.reply({ content: `✅ Głos oddany na: **${votedOption}**`, ephemeral: true });
    });

    collector.on('end', () => {
        const poll = activePolls.get(pollId);
        if (poll) {
            // Automatycznie pokaż wyniki
            let resultsText = '';
            
            for (const [option, votes] of Object.entries(poll.votes)) {
                const percentage = poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0;
                const barLength = Math.round((percentage / 100) * 10);
                const bar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);
                resultsText += `**${option}**: ${votes} głosów (${percentage}%)\n${bar}\n\n`;
            }
            
            const finalEmbed = new EmbedBuilder()
                .setTitle(`📊 Wyniki ankiety: ${poll.question}`)
                .setColor(0x57F287)
                .setDescription(resultsText)
                .addFields(
                    { name: '📈 Łącznie głosów', value: `${poll.totalVotes}`, inline: true },
                    { name: '👥 Głosujący', value: `${poll.voters.size}`, inline: true }
                )
                .setFooter({ text: `Ankieta zakończona • BotNexus` })
                .setTimestamp();
            
            sentMessage.edit({ embeds: [finalEmbed], components: [] });
            activePolls.delete(pollId);
        }
    });
}
