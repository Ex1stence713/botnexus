import { EmbedBuilder } from 'discord.js';

export const name = 'przypomnij-admin';
export const description = 'Wyślij wiadomość na PV do całej administracji';

const ADMIN_ROLE_ID = "1463651990331457546";

export async function execute(message, args) {
    if (!message.guild) {
        return message.reply('Ta komenda działa tylko na serwerze!');
    }
    
    if (args.length < 1) {
        return message.reply('Podaj treść wiadomości! Użycie: !przypomnij-admin <treść>');
    }
    
    const content = args.join(' ');

    const role = message.guild.roles.cache.get(ADMIN_ROLE_ID);
    if (!role) {
        return message.reply('Nie znaleziono rangi administracji.');
    }

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('📨 Nowa wiadomość od administracji!')
        .addFields(
            { name: '📝 Treść', value: content, inline: false }
        )
        .setFooter({ text: 'Bot Nexus' })
        .setTimestamp();

    let sentCount = 0;
    for (const member of role.members.values()) {
        try {
            await member.send({ embeds: [embed] });
            sentCount++;
        } catch {
            console.log(`Nie można wysłać DM do ${member.user.tag}`);
        }
    }

    await message.reply(`✅ Wiadomość wysłana do **${sentCount}** administratorów.`);
}
