const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dmall')
        .setDescription('Wysyła wiadomość do wszystkich członków serwera')
        .addStringOption(option =>
            option.setName('wiadomosc')
                .setDescription('Treść wiadomości')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {

        const message = interaction.options.getString('wiadomosc');
        const guild = interaction.guild;

        await interaction.reply({ content: "Rozpoczynam wysyłanie wiadomości...", ephemeral: true });

        const members = await guild.members.fetch();

        let sent = 0;

        for (const member of members.values()) {

            if (member.user.bot) continue;

            try {
                await member.send(message);
                sent++;
            } catch (err) {
                console.log(`Nie można wysłać do ${member.user.tag}`);
            }

            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 sekundy przerwy
        }

        interaction.followUp({ content: `Wysłano wiadomość do ${sent} użytkowników.`, ephemeral: true });
    }
};
