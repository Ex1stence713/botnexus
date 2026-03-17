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
    
    // Reszta to tytuł i treść
    const argsWithoutChannel = args.slice(0, -1);
    const title = argsWithoutChannel[0];
    const contentRaw = argsWithoutChannel.slice(1).join(' ');
    
    if (!channel.isTextBased()) {
        return message.reply('Wybrany kanał musi być tekstowy!');
    }
    
    // Automatyczne formatowanie punktów (jeśli użytkownik użyje średnika ;)
    const formattedContent = contentRaw
        .split(';')
        .map(line => `• ${line.trim()}`)
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
