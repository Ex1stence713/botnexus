import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

// Mapa aktywnych ankiet
const activeAnkiety = new Map();

export const name = 'ankieta';
export const description = 'Szybka ankieta Tak/Nie';

export async function execute(message, args) {
    if (args.length === 0) {
        return message.reply(`📊 **Szybka ankieta Tak/Nie**

Użycie: \`!ankieta <pytanie>\`

Przykład:
\`!ankieta Czy lubisz pizzę?\``);
    }

    const question = args.join(' ');
    const ankietaId = `ankieta_${Date.now()}`;

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`ankieta_${ankietaId}_tak`)
                .setLabel('✅ Tak')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`ankieta_${ankietaId}_nie`)
                .setLabel('❌ Nie')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(`ankieta_${ankietaId}_results`)
                .setLabel('📊 Wyniki')
                .setStyle(ButtonStyle.Secondary)
        );

    const ankietaEmbed = new EmbedBuilder()
        .setTitle('📊 Ankieta')
        .setDescription(`**${question}**\n\n✅ Tak | ❌ Nie`)
        .setColor(0x5865F2)
        .addFields(
            { name: '✅ Tak', value: '0', inline: true },
            { name: '❌ Nie', value: '0', inline: true },
            { name: '👥 Głosujący', value: '0', inline: true }
        )
        .setFooter({ text: `ID: ${ankietaId}` })
        .setTimestamp();

    const sentMessage = await message.reply({ embeds: [ankietaEmbed], components: [row] });

    // Zapisz ankietę
    activeAnkiety.set(ankietaId, {
        id: ankietaId,
        question,
        tak: 0,
        nie: 0,
        voters: new Set(),
        messageId: sentMessage.id,
        channelId: message.channel.id,
        createdAt: Date.now()
    });

    // Obsługa głosów
    const filter = i => i.customId.startsWith(`ankieta_${ankietaId}`);
    const collector = sentMessage.createMessageComponentCollector({ filter, time: 24 * 60 * 60 * 1000 });

    collector.on('collect', async i => {
        const ankieta = activeAnkiety.get(ankietaId);
        if (!ankieta) return;

        if (i.customId === `ankieta_${ankietaId}_results`) {
            const total = ankieta.tak + ankieta.nie;
            const takProc = total > 0 ? Math.round((ankieta.tak / total) * 100) : 0;
            const nieProc = total > 0 ? Math.round((ankieta.nie / total) * 100) : 0;
            
            const resultsEmbed = new EmbedBuilder()
                .setTitle(`📊 Wyniki ankiety: ${ankieta.question}`)
                .setColor(0x57F287)
                .setDescription(`**Wyniki:**\n\n✅ Tak: ${ankieta.tak} głosów (${takProc}%)\n❌ Nie: ${ankieta.nie} głosów (${nieProc}%)\n\n📈 Łącznie: ${total} głosów`)
                .setFooter({ text: 'BotNexus' })
                .setTimestamp();
            
            return i.reply({ embeds: [resultsEmbed], ephemeral: true });
        }

        // Sprawdź czy głosował
        if (ankieta.voters.has(i.user.id)) {
            return i.reply({ content: '❌ Już głosowałeś!', ephemeral: true });
        }

        // Dodaj głos
        if (i.customId.includes('_tak')) {
            ankieta.tak++;
        } else if (i.customId.includes('_nie')) {
            ankieta.nie++;
        }
        
        ankieta.voters.add(i.user.id);

        const total = ankieta.tak + ankieta.nie;

        const ankietaEmbed = new EmbedBuilder()
            .setTitle('📊 Ankieta')
            .setDescription(`**${question}**\n\n✅ Tak | ❌ Nie`)
            .setColor(0x5865F2)
            .addFields(
                { name: '✅ Tak', value: `${ankieta.tak}`, inline: true },
                { name: '❌ Nie', value: `${ankieta.nie}`, inline: true },
                { name: '👥 Głosujący', value: `${total}`, inline: true }
            )
            .setFooter({ text: `ID: ${ankietaId} • Głos oddany!` })
            .setTimestamp();

        await i.message.edit({ embeds: [ankietaEmbed] });
        await i.reply({ content: '✅ Głos oddany!', ephemeral: true });
    });

    collector.on('end', () => {
        const ankieta = activeAnkiety.get(ankietaId);
        if (ankieta) {
            const total = ankieta.tak + ankieta.nie;
            const takProc = total > 0 ? Math.round((ankieta.tak / total) * 100) : 0;
            const nieProc = total > 0 ? Math.round((ankieta.nie / total) * 100) : 0;
            
            const finalEmbed = new EmbedBuilder()
                .setTitle(`📊 Wyniki ankiety: ${ankieta.question}`)
                .setColor(0x57F287)
                .setDescription(`**Wyniki:**\n\n✅ Tak: ${ankieta.tak} głosów (${takProc}%)\n❌ Nie: ${ankieta.nie} głosów (${nieProc}%)\n\n📈 Łącznie: ${total} głosów`)
                .setFooter({ text: 'Ankieta zakończona • BotNexus' })
                .setTimestamp();
            
            sentMessage.edit({ embeds: [finalEmbed], components: [] });
            activeAnkiety.delete(ankietaId);
        }
    });
}
