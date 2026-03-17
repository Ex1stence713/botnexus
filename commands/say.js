export const name = 'say';
export const description = 'Bot wysyła wiadomość';

export async function execute(message, args) {
    if (!message.member?.permissions.has('ManageMessages')) {
        return message.reply('Nie masz uprawnień do używania tej komendy!');
    }
    
    if (args.length === 0) {
        return message.reply('Podaj tekst! Użycie: !say <tekst>');
    }
    
    const text = args.join(' ');
    const embed = args.includes('--embed') || args.includes('-e');
    
    // Usuń flagi z tekstu
    const cleanText = text.replace(/--embed|-e/g, '').trim();

    if (embed) {
        const { EmbedBuilder } = await import('discord.js');
        const embedMessage = new EmbedBuilder()
            .setDescription(cleanText)
            .setColor(0x5865F2);
        
        await message.channel.send({ embeds: [embedMessage] });
    } else {
        await message.channel.send(cleanText);
    }
    
    // Usuń wiadomość użytkownika
    try {
        await message.delete();
    } catch (e) {
        // Ignoruj błędy
    }
}
