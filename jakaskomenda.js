import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('dajrange')
    .setDescription('Nadaje rangę o podanym ID wszystkim członkom serwera.')
    .addStringOption(option =>
        option.setName('roleid')
            .setDescription('ID rangi do nadania')
            .setRequired(true)
    );

export async function execute(interaction) {
    const roleId = interaction.options.getString('roleid');
    const guild = interaction.guild;
    const role = guild.roles.cache.get(roleId);

    if (!role) {
        return interaction.reply({ content: 'Nie znaleziono rangi o podanym ID.', ephemeral: true });
    }

    await interaction.reply('Nadaję rangę wszystkim członkom...');

    const members = await guild.members.fetch();
    let success = 0, fail = 0;

    for (const member of members.values()) {
        if (!member.roles.cache.has(roleId)) {
            try {
                await member.roles.add(roleId);
                success++;
            } catch {
                fail++;
            }
        }
    }

    await interaction.followUp(`Ranga została nadana ${success} członkom. Niepowodzenia: ${fail}.`);
}