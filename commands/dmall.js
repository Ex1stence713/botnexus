import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('dmall')
        .setDescription('Wysyła wiadomość do wszystkich użytkowników serwera')
        .addStringOption(option => 
            option.setName('message')
                .setDescription('Treść wiadomości')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Tylko dla adminów

    async execute(interaction) {
        const messageText = interaction.options.getString('message');
        const members = await interaction.guild.members.fetch();
        
        // Embed dla potwierdzenia rozpoczęcia
        const startEmbed = new EmbedBuilder()
            .setTitle('📤 Rozpoczynanie wysyłania...')
            .setDescription('Trwa wysyłanie wiadomości do wszystkich członków serwera.')
            .setColor(0x5865F2)
            .addFields(
                { name: '👤 Od', value: interaction.user.tag, inline: true },
                { name: '📊 Łącznie członków', value: `${members.size}`, inline: true },
                { name: '⏰ Czas', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: false }
            );
        
        await interaction.reply({ embeds: [startEmbed], ephemeral: true });

        let successCount = 0;
        let failCount = 0;
        const failedUsers = [];

        for (const [id, member] of members) {
            if (member.user.bot) continue;
            try {
                // Embed dla wiadomości DM
                const dmEmbed = new EmbedBuilder()
                    .setTitle('📨 Nowa Wiadomość')
                    .setDescription(messageText)
                    .setColor(0x5865F2)
                    .addFields(
                        { name: '👤 Od', value: interaction.user.tag, inline: true },
                        { name: '🏢 Serwer', value: interaction.guild.name, inline: true },
                        { name: '⏰ Czas', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: false }
                    )
                    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
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

        await interaction.editReply({ embeds: [resultEmbed] });
    },
};