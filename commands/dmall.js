import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

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
        
        await interaction.reply({ content: 'Rozpoczynam wysyłanie wiadomości...', ephemeral: true });

        let successCount = 0;
        for (const [id, member] of members) {
            if (member.user.bot) continue;
            try {
                await member.send(messageText);
                successCount++;
            } catch (err) {
                console.log(`Nie można wysłać DM do ${member.user.tag}`);
            }
        }

        await interaction.editReply({ content: `Wysłano wiadomość do ${successCount} osób.` });
    },
};