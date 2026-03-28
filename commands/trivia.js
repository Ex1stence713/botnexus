import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const name = 'trivia';
export const description = 'Quiz wiedzy ogólnej';

const questions = [
    {
        question: 'Jaka jest stolica Polski?',
        options: ['Warszawa', 'Kraków', 'Gdańsk', 'Wrocław'],
        correct: 0
    },
    {
        question: 'Kto napisał "Pana Tadeusza"?',
        options: ['Adam Mickiewicz', 'Juliusz Słowacki', 'Henryk Sienkiewicz', 'Bolesław Prus'],
        correct: 0
    },
    {
        question: 'Jaka jest największa planeta w Układzie Słonecznym?',
        options: ['Jowisz', 'Saturn', 'Uran', 'Neptun'],
        correct: 0
    },
    {
        question: 'W którym roku rozpoczęła się II wojna światowa?',
        options: ['1939', '1940', '1941', '1938'],
        correct: 0
    },
    {
        question: 'Jaki jest symbol chemiczny złota?',
        options: ['Au', 'Ag', 'Fe', 'Cu'],
        correct: 0
    },
    {
        question: 'Kto namalował "Mona Lisę"?',
        options: ['Leonardo da Vinci', 'Michelangelo', 'Rafael', 'Donatello'],
        correct: 0
    },
    {
        question: 'Jaka jest największa rzeka na świecie?',
        options: ['Amazonka', 'Nil', 'Jangcy', 'Missisipi'],
        correct: 0
    },
    {
        question: 'Ile kontynentów jest na Ziemi?',
        options: ['7', '6', '5', '8'],
        correct: 0
    },
    {
        question: 'Jaki jest najwyższy szczyt na świecie?',
        options: ['Mount Everest', 'K2', 'Kangchenjunga', 'Lhotse'],
        correct: 0
    },
    {
        question: 'Kto wynalazł żarówkę?',
        options: ['Thomas Edison', 'Nikola Tesla', 'Alexander Graham Bell', 'Albert Einstein'],
        correct: 0
    },
    {
        question: 'Jaki jest największy ocean na świecie?',
        options: ['Spokojny', 'Atlantycki', 'Indyjski', 'Arktyczny'],
        correct: 0
    },
    {
        question: 'Ile kości ma dorosły człowiek?',
        options: ['206', '208', '204', '210'],
        correct: 0
    },
    {
        question: 'Jaka jest stolica Francji?',
        options: ['Paryż', 'Lyon', 'Marsylia', 'Tuluza'],
        correct: 0
    },
    {
        question: 'Kto napisał "Hamleta"?',
        options: ['William Shakespeare', 'Charles Dickens', 'Jane Austen', 'Mark Twain'],
        correct: 0
    },
    {
        question: 'Jaki jest najmniejszy kraj na świecie?',
        options: ['Watykan', 'Monako', 'San Marino', 'Liechtenstein'],
        correct: 0
    }
];

// Konfiguracja auto-trivia
const TRIVIA_CHANNEL_ID = '1486795745376862302'; // ID kanału do auto-trivia
const TRIVIA_INTERVAL = 300000; // 5 minut w milisekundach

let triviaInterval = null;

// Funkcja do wysyłania trivia na kanał
export async function sendTriviaToChannel(client) {
    try {
        const channel = await client.channels.fetch(TRIVIA_CHANNEL_ID).catch(() => null);
        if (!channel) {
            console.log('❌ Nie znaleziono kanału do auto-trivia');
            return;
        }

        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        
        const embed = new EmbedBuilder()
            .setTitle('🎯 Auto-Trivia!')
            .setColor(0x5865F2)
            .setDescription(randomQuestion.question)
            .addFields(
                { name: 'A', value: randomQuestion.options[0], inline: true },
                { name: 'B', value: randomQuestion.options[1], inline: true },
                { name: 'C', value: randomQuestion.options[2], inline: true },
                { name: 'D', value: randomQuestion.options[3], inline: true }
            )
            .setFooter({ text: 'Masz 30 sekund na odpowiedź! Kliknij przycisk.' })
            .setTimestamp();
        
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('trivia_auto_a')
                    .setLabel('A')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('trivia_auto_b')
                    .setLabel('B')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('trivia_auto_c')
                    .setLabel('C')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('trivia_auto_d')
                    .setLabel('D')
                    .setStyle(ButtonStyle.Primary)
            );
        
        const sentMessage = await channel.send({ embeds: [embed], components: [row] });
        
        const filter = i => i.customId.startsWith('trivia_auto_');
        const collector = sentMessage.createMessageComponentCollector({ filter, time: 30000 });
        
        const answeredUsers = new Set();
        
        collector.on('collect', async i => {
            if (answeredUsers.has(i.user.id)) {
                await i.reply({ content: 'Już odpowiedziałeś na to pytanie!', ephemeral: true });
                return;
            }
            
            answeredUsers.add(i.user.id);
            
            const selectedAnswer = i.customId.replace('trivia_auto_', '');
            const answerIndex = selectedAnswer.charCodeAt(0) - 97;
            
            const isCorrect = answerIndex === randomQuestion.correct;
            
            const resultEmbed = new EmbedBuilder()
                .setTitle(isCorrect ? '✅ Poprawna odpowiedź!' : '❌ Zła odpowiedź!')
                .setColor(isCorrect ? 0x57F287 : 0xED4245)
                .addFields(
                    { name: 'Pytanie', value: randomQuestion.question, inline: false },
                    { name: 'Twoja odpowiedź', value: randomQuestion.options[answerIndex], inline: true },
                    { name: 'Poprawna odpowiedź', value: randomQuestion.options[randomQuestion.correct], inline: true },
                    { name: 'Użytkownik', value: i.user.username, inline: true }
                )
                .setFooter({ text: 'BotNexus' })
                .setTimestamp();
            
            await i.reply({ embeds: [resultEmbed], ephemeral: false });
        });
        
        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                const timeoutEmbed = new EmbedBuilder()
                    .setTitle('⏰ Czas minął!')
                    .setColor(0xED4245)
                    .addFields(
                        { name: 'Pytanie', value: randomQuestion.question, inline: false },
                        { name: 'Poprawna odpowiedź', value: randomQuestion.options[randomQuestion.correct], inline: false }
                    )
                    .setFooter({ text: 'BotNexus' })
                    .setTimestamp();
                
                await sentMessage.edit({ embeds: [timeoutEmbed], components: [] });
            }
        });
        
        console.log('✅ Wysłano auto-trivia na kanał');
    } catch (err) {
        console.error('❌ Błąd auto-trivia:', err);
    }
}

// Funkcja do uruchamiania auto-trivia
export function startAutoTrivia(client) {
    if (triviaInterval) {
        console.log('⚠️ Auto-trivia już działa');
        return;
    }
    
    console.log('🎮 Uruchamianie auto-trivia...');
    
    // Wyślij pierwsze trivia od razu
    sendTriviaToChannel(client);
    
    // Ustaw interwał
    triviaInterval = setInterval(() => {
        sendTriviaToChannel(client);
    }, TRIVIA_INTERVAL);
    
    console.log(`✅ Auto-trivia uruchomione (co ${TRIVIA_INTERVAL / 1000} sekund)`);
}

// Funkcja do zatrzymywania auto-trivia
export function stopAutoTrivia() {
    if (triviaInterval) {
        clearInterval(triviaInterval);
        triviaInterval = null;
        console.log('🛑 Auto-trivia zatrzymane');
    }
}

export async function execute(message, args) {
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    
    const embed = new EmbedBuilder()
        .setTitle('🎯 Trivia!')
        .setColor(0x5865F2)
        .setDescription(randomQuestion.question)
        .addFields(
            { name: 'A', value: randomQuestion.options[0], inline: true },
            { name: 'B', value: randomQuestion.options[1], inline: true },
            { name: 'C', value: randomQuestion.options[2], inline: true },
            { name: 'D', value: randomQuestion.options[3], inline: true }
        )
        .setFooter({ text: 'Masz 15 sekund na odpowiedź!' })
        .setTimestamp();
    
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('trivia_a')
                .setLabel('A')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('trivia_b')
                .setLabel('B')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('trivia_c')
                .setLabel('C')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('trivia_d')
                .setLabel('D')
                .setStyle(ButtonStyle.Primary)
        );
    
    const sentMessage = await message.reply({ embeds: [embed], components: [row] });
    
    const filter = i => i.user.id === message.author.id;
    const collector = sentMessage.createMessageComponentCollector({ filter, time: 15000 });
    
    collector.on('collect', async i => {
        const selectedAnswer = i.customId.replace('trivia_', '');
        const answerIndex = selectedAnswer.charCodeAt(0) - 97;
        
        const isCorrect = answerIndex === randomQuestion.correct;
        
        const resultEmbed = new EmbedBuilder()
            .setTitle(isCorrect ? '✅ Poprawna odpowiedź!' : '❌ Zła odpowiedź!')
            .setColor(isCorrect ? 0x57F287 : 0xED4245)
            .addFields(
                { name: 'Pytanie', value: randomQuestion.question, inline: false },
                { name: 'Twoja odpowiedź', value: randomQuestion.options[answerIndex], inline: true },
                { name: 'Poprawna odpowiedź', value: randomQuestion.options[randomQuestion.correct], inline: true }
            )
            .setFooter({ text: 'BotNexus' })
            .setTimestamp();
        
        await i.update({ embeds: [resultEmbed], components: [] });
        collector.stop();
    });
    
    collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
            const timeoutEmbed = new EmbedBuilder()
                .setTitle('⏰ Czas minął!')
                .setColor(0xED4245)
                .addFields(
                    { name: 'Pytanie', value: randomQuestion.question, inline: false },
                    { name: 'Poprawna odpowiedź', value: randomQuestion.options[randomQuestion.correct], inline: false }
                )
                .setFooter({ text: 'BotNexus' })
                .setTimestamp();
            
            await sentMessage.edit({ embeds: [timeoutEmbed], components: [] });
        }
    });
}
