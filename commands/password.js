import { EmbedBuilder } from 'discord.js';

export const name = 'password';
export const description = 'Generuje losowe hasło';

export async function execute(message, args) {
    let length = 16;
    
    if (args.length > 0) {
        const requestedLength = parseInt(args[0]);
        if (!isNaN(requestedLength) && requestedLength >= 8 && requestedLength <= 64) {
            length = requestedLength;
        } else if (requestedLength < 8) {
            return message.reply('Hasło musi mieć co najmniej 8 znaków!');
        } else if (requestedLength > 64) {
            return message.reply('Hasło może mieć maksymalnie 64 znaki!');
        }
    }
    
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    
    let password = '';
    
    // Upewnij się, że hasło zawiera co najmniej jeden znak z każdej kategorii
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Wypełnij resztę losowymi znakami
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Przemieszaj hasło
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    const embed = new EmbedBuilder()
        .setTitle('🔐 Generator haseł')
        .setColor(0x5865F2)
        .addFields(
            { name: '🔑 Hasło', value: `\`${password}\``, inline: false },
            { name: '📏 Długość', value: `${length} znaków`, inline: true },
            { name: '📊 Zawiera', value: 'A-Z, a-z, 0-9, symbole', inline: true }
        )
        .setFooter({ text: 'BotNexus • Nie udostępniaj hasła!' })
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}
