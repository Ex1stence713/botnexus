import { EmbedBuilder } from 'discord.js';

export const name = 'ascii';
export const description = 'Konwertuje tekst na ASCII art';

export async function execute(message, args) {
    if (args.length === 0) {
        return message.reply('Podaj tekst! Użycie: !ascii <tekst>');
    }
    
    const text = args.join(' ').toUpperCase();
    
    const asciiChars = {
        'A': '  A  ', 'B': ' Bbb ', 'C': ' Cc  ', 'D': ' Dd  ', 'E': ' Eee ', 'F': ' Fff ',
        'G': ' Ggg ', 'H': ' Hh  ', 'I': ' Iii ', 'J': '  Jj ', 'K': ' Kk  ', 'L': ' Lll ',
        'M': 'Mm M', 'N': ' Nnn ', 'O': ' Ooo ', 'P': ' Ppp ', 'Q': ' Qqq ', 'R': ' Rrr ',
        'S': ' Sss ', 'T': ' Ttt ', 'U': ' Uu  ', 'V': ' Vv  ', 'W': 'W   W', 'X': ' Xx  ',
        'Y': ' Yy  ', 'Z': ' Zzz ', '0': ' 000 ', '1': '  1  ', '2': ' 222 ', '3': ' 333 ',
        '4': ' 4 4 ', '5': ' 555 ', '6': ' 666 ', '7': ' 777 ', '8': ' 888 ', '9': ' 999 ',
        ' ': '     '
    };
    
    let result = '';
    for (const char of text) {
        result += asciiChars[char] || char + '   ';
    }
    
    if (result.length > 2000) {
        return message.reply('Tekst jest zbyt długi!');
    }
    
    const embed = new EmbedBuilder()
        .setTitle('🎨 ASCII Art')
        .setColor(0x5865F2)
        .setDescription('```\n' + result + '\n```')
        .addFields(
            { name: '📝 Oryginalny tekst', value: args.join(' '), inline: false }
        )
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
}