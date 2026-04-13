import { EmbedBuilder } from 'discord.js';

export const name = 'quote';
export const description = 'Wyświetla losowy cytat';

export async function execute(message, args) {
    const quotes = [
        { text: 'Jedynym sposobem na zrobienie wielkiej pracy jest kochanie tego, co robisz.', author: 'Steve Jobs' },
        { text: 'Sukces to suma małych wysiłków, powtarzanych dzień po dniu.', author: 'Robert Collier' },
        { text: 'Nie czekaj. Pora nigdy nie będzie idealna.', author: 'Napoleon Hill' },
        { text: 'Jedyne niemożliwe rzeczy to te, których nie próbujemy.', author: 'Unknown' },
        { text: 'Twoje życie jest tworzone przez to, co myślisz, nie przez to, co czujesz.', author: 'Unknown' },
        { text: 'Najlepszy czas na zasadzenie drzewa był 20 lat temu. Drugi najlepszy czas jest teraz.', author: 'Przysłowie chińskie' },
        { text: 'Nie bój się porażki. Bój się tego, że za 10 lat będziesz w tym samym miejscu.', author: 'Unknown' },
        { text: 'Marzenia nie działają, chyba że ty działasz.', author: 'John C. Maxwell' },
        { text: 'Jedyną granicą naszego jutrzejszego dnia są nasze dzisiejsze wątpliwości.', author: 'Franklin D. Roosevelt' },
        { text: 'Sukces nie jest końcem, porażka nie jest katastrofą: liczy się odwaga, by kontynuować.', author: 'Winston Churchill' },
        { text: 'Nie musisz być wielki, żeby zacząć, ale musisz zacząć, żeby być wielki.', author: 'Zig Ziglar' },
        { text: 'Twoja postarzona twarz jest wynikiem twoich myśli.', author: 'Unknown' },
        { text: 'Nie czekaj na idealną chwilę, chwyć chwilę i uczyń ją idealną.', author: 'Unknown' },
        { text: 'Jedynym sposobem na odkrycie granic możliwości jest przekroczenie ich.', author: 'Arthur C. Clarke' },
        { text: 'Sukces to nie klucz do szczęścia. Szczęście jest kluczem do sukcesu.', author: 'Albert Schweitzer' }
    ];
    
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    
    const embed = new EmbedBuilder()
        .setTitle('💭 Losowy cytat')
        .setColor(0x5865F2)
        .setDescription(`*"${randomQuote.text}"*`)
        .addFields(
            { name: '✍️ Autor', value: randomQuote.author, inline: false }
        )
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}
