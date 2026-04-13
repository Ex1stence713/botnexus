import { EmbedBuilder } from 'discord.js';

export const name = 'fact';
export const description = 'Wyświetla losowy ciekawy fakt';

export async function execute(message, args) {
    const facts = [
        'Ośmiornice mają trzy serca.',
        'Banany są radioaktywne.',
        'Miod nigdy się nie psuje.',
        'Krokodyle nie potrafią wystawić języka.',
        'Serce krewetki znajduje się w jej głowie.',
        'Słonie są jedynymi zwierzętami, które nie potrafią skakać.',
        'Koty mają ponad 20 dźwięków, w tym mruczenie, miauczenie i syczenie.',
        'Światło słoneczne dociera do Ziemi w około 8 minut.',
        'Ludzkie oko może rozróżnić około 10 milionów kolorów.',
        'Delfiny śpią z jednym otwartym okiem.',
        'Motyle smakują stopami.',
        'Każda minuta umiera 100 gwiazd we wszechświecie.',
        'Ludzkie ciało zawiera wystarczająco dużo żelaza, aby zrobić 3-calowy gwóźdź.',
        'Ślimaki mogą spać nawet 3 lata.',
        'Wielbłądy mają trzy powieki, aby chronić oczy przed piaskiem.',
        'Ludzkie włosy są praktycznie niezniszczalne.',
        'Pingwiny mają kolana, ale są ukryte pod piórami.',
        'Krowy mają najlepszych przyjaciół i stresują się, gdy są rozdzielone.',
        'Ludzkie ciało emituje wystarczająco dużo ciepła, aby zagotować wodę w 30 minut.',
        'Każdego dnia ludzkie serce wykonuje pracę równą podniesieniu 1 tony na wysokość 1 metra.'
    ];
    
    const randomFact = facts[Math.floor(Math.random() * facts.length)];
    
    const embed = new EmbedBuilder()
        .setTitle('📚 Ciekawy fakt')
        .setColor(0x5865F2)
        .setDescription(randomFact)
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}
