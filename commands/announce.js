import { EmbedBuilder } from 'discord.js';

export const name = 'announce';
export const description = 'Wysyła ogłoszenie na serwer';

export async function execute(message, args) {
    if (!message.member?.permissions.has('ManageMessages')) {
        return message.reply('Nie masz uprawnień do używania tej komendy!');
    }
    
    if (args.length < 3) {
        return message.reply('Podaj tytuł, treść i kanał! Użycie: !announce <tytul> <tresc> <#kanal>');
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
    const content = argsWithoutChannel.slice(1).join(' ');
    
    // Sprawdźment role (opcjonalne)
    let pingRole = null;
    if (content.includes('<@&')) {
        const roleMatch = content.match(/<@&(\d+)>/);
        if (roleMatch) {
            pingRole = message.guild?.roles.cache.get(roleMatch[1]);
        }
    }
    
    const embed = new EmbedBuilder()
        .setAuthor({ 
            name: '📣 Ogłoszenie', 
            iconURL: message.guild?.iconURL() 
        })
        .setTitle(title)
        .setDescription(content.replace(/<@&\d+>/g, ''))
        .setColor('#ED4245')
        .addFields(
            { name: '👤 Ogłoszenie przez', value: `${message.author}`, inline: true },
            { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setFooter({ 
            text: `${message.guild?.name} • Announce`, 
            iconURL: message.guild?.iconURL() 
        })
        .setTimestamp();

    try {
        const messageContent = pingRole ? `${pingRole} 📣` : '';
        await channel.send({ content: messageContent, embeds: [embed] });
        return message.reply(`✅ Wysłano ogłoszenie na kanał <#${channel.id}>`);
    } catch (err) {
        console.error('Błąd przy wysyłaniu ogłoszenia:', err);
        return message.reply('❌ Nie udało się wysłać ogłoszenia!');
    }
}
