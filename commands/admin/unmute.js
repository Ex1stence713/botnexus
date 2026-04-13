import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export const name = 'unmute';
export const description = 'Odcisza użytkownika';

const MUTE_ROLE_ID = '1463630780692697201';

export async function execute(message, args) {
    const { guild, member } = message;

    if (!guild) return message.reply('Ta komenda działa tylko na serwerze.');

    if (!member?.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return message.reply('Nie masz uprawnień do odciszania użytkowników.');
    }

    if (args.length === 0) {
        return message.reply('Podaj użytkownika! Użycie: !unmute <@użytkownik>');
    }
    
    const userId = args[0].replace(/<@!?/g, '').replace(/>/g, '');
    const target = await guild.members.fetch(userId).catch(() => null);
    
    if (!target) {
        return message.reply('Nie znaleziono użytkownika na serwerze.');
    }

    if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return message.reply('Bot nie ma uprawnień do zarządzania rolami.');
    }

    const muteRole = guild.roles.cache.get(MUTE_ROLE_ID);
    if (!muteRole) {
        return message.reply('Rola Muted nie istnieje.');
    }

    if (!target.roles.cache.has(muteRole.id)) {
        return message.reply('Ten użytkownik nie jest wyciszony.');
    }

    await target.roles.remove(muteRole);
    
    const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('🔊 Użytkownik odciszony')
        .addFields(
            { name: '👤 Użytkownik', value: target.user.tag, inline: true },
            { name: '🛡️ Moderator', value: message.author.tag, inline: true }
        )
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();
    await message.reply({ embeds: [embed] });
}
