import { EmbedBuilder } from 'discord.js';

export const name = 'changelog';
export const description = 'Publikuje estetyczne nowości na serwerze';

export async function execute(message, args) {
    if (!message.member?.permissions.has('ManageMessages')) {
        return message.reply('Nie masz uprawnień do używania tej komendy!');
    }

    if (args.length < 3) {
        return message.reply('Podaj tytuł, treść i kanał! Użycie: !changelog <tytul> <tresc> <#kanal>');
    }

    // Znajdź kanał (ostatni argument to kanał)
    const channelMention = args[args.length - 1];
    const channelId = channelMention.replace(/<#|>/g, '');
    const channel = message.guild?.channels.cache.get(channelId);

    if (!channel) {
        return message.reply('Nie znaleziono kanału!');
    }

    if (!channel.isTextBased()) {
        return message.reply('Wybrany kanał musi być tekstowy!');
    }

    // Wyodrębnij treść z surowej treści wiadomości, zachowując nowe linie
    // Prefix "!changelog " = 10 znaków
    const rawContent = message.content
        .slice(message.content.indexOf(' ') + 1) // Usuń "!changelog"
        .trimStart();
    // Usuń wzmiankę o kanale z końca (może być oddzielona spacją lub nową linią)
    const contentWithoutChannel = rawContent
        .replace(new RegExp(`${channelMention}\\s*$`), '')
        .trim();

    // Pierwsza linia to tytuł, reszta to treść
    const firstNewline = contentWithoutChannel.indexOf('\n');
    let title, contentRaw;
    if (firstNewline === -1) {
        // Brak nowej linii - spróbuj znaleźć tytuł w argach
        const argsWithoutChannel = args.slice(0, -1);
        title = argsWithoutChannel[0];
        contentRaw = argsWithoutChannel.slice(1).join(' ');
    } else {
        title = contentWithoutChannel.slice(0, firstNewline).trim();
        contentRaw = contentWithoutChannel.slice(firstNewline + 1).trim();
    }

    // Automatyczne formatowanie punktów - dzieli po średniku ORAZ nowych liniach
    const formattedContent = contentRaw
        .split(/[;\n]+/)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => `• ${line}`)
        .join('\n');
    
    const embed = new EmbedBuilder()
        .setAuthor({
            name: `Aktualizacja: ${message.guild?.name}`,
            iconURL: message.guild?.iconURL({ dynamic: true })
        })
        .setTitle(`✨ ${title}`)
        .setDescription(`\n${formattedContent}\n\n`)
        .setColor('#5865F2')
        .addFields(
            {
                name: '🛠️ Deweloper',
                value: `${message.author}`,
                inline: true
            },
            {
                name: '📅 Data',
                value: `<t:${Math.floor(Date.now() / 1000)}:d>`,
                inline: true
            }
        )
        .setFooter({
            text: `Wersja produkcyjna • ${message.guild?.name}`,
        })
        .setTimestamp();

    try {
        await channel.send({
            embeds: [embed]
        });

        await message.reply(`✅ Pomyślnie opublikowano nowości na kanale ${channel}`);

    } catch (err) {
        console.error(err);
        return message.reply('❌ Nie udało się wysłać changelogu. Sprawdź moje uprawnienia na tamtym kanale.');
    }
}
