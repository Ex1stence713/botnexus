import { EmbedBuilder } from 'discord.js';

export const name = 'dmall';
export const description = 'Wysyła wiadomość do wszystkich użytkowników serwera';

export default {
    name: 'dmall',
    description: 'Wysyła wiadomość do wszystkich użytkowników serwera',
    
    async execute(message, args) {
        if (!message.member?.permissions.has('Administrator')) {
            return message.reply('Tylko administratorzy mogą używać tej komendy!');
        }
        
        if (args.length === 0) {
            return message.reply('Podaj wiadomość! Użycie: !dmall <wiadomość>');
        }
        
        if (!message.guild) {
            return message.reply('Ta komenda działa tylko na serwerze!');
        }
        
        const messageText = args.join(' ');
        const members = await message.guild.members.fetch();
        
        // Embed dla potwierdzenia rozpoczęcia
        const startEmbed = new EmbedBuilder()
            .setTitle('📤 Rozpoczynanie wysyłania...')
            .setDescription('Trwa wysyłanie wiadomości do wszystkich członków serwera.')
            .setColor(0x5865F2)
            .addFields(
                { name: '👤 Od', value: message.author.tag, inline: true },
                { name: '📊 Łącznie członków', value: `${members.size}`, inline: true },
                { name: '⏰ Czas', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: false }
            );
        
        await message.reply({ embeds: [startEmbed] });

        let successCount = 0;
        let failCount = 0;
        const failedUsers = [];

        for (const [id, member] of members) {
            if (member.user.bot) continue;
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('📨 Nowa Wiadomość')
                    .setDescription(messageText)
                    .setColor(0x5865F2)
                    .addFields(
                        { name: '👤 Od', value: message.author.tag, inline: true },
                        { name: '🏢 Serwer', value: message.guild.name, inline: true },
                        { name: '⏰ Czas', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: false }
                    )
                    .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: 'Wiadomość wysłana przez bota serwera' })
                    .setTimestamp();
                
                await member.send({ embeds: [dmEmbed] });
                successCount++;
            } catch (err) {
                failCount++;
                failedUsers.push(member.user.tag);
                console.log(`Nie można wysłać DM do ${member.user.tag}`);
            }
        }

        // Embed z wynikami
        const resultEmbed = new EmbedBuilder()
            .setTitle('✅ Wysyłanie zakończone')
            .setColor(0x57F287)
            .addFields(
                { name: '✅ Wysłane', value: `${successCount}`, inline: true },
                { name: '❌ Niepowodzenia', value: `${failCount}`, inline: true },
                { name: '📊 Łącznie', value: `${successCount + failCount}`, inline: false }
            );
        
        if (failedUsers.length > 0 && failedUsers.length <= 5) {
            resultEmbed.addFields(
                { name: '⚠️ Niepowodzenia', value: failedUsers.join(', '), inline: false }
            );
        }
        
        resultEmbed.setTimestamp();

        await message.reply({ embeds: [resultEmbed] });
    },
};
