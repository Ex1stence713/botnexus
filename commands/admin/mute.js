import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export const name = 'mute';
export const description = 'Wycisza użytkownika';

const MUTE_ROLE_ID = '1463630780692697201';

export async function execute(message, args) {
    const { guild, member } = message;

    if (!guild) return message.reply('Ta komenda działa tylko na serwerze.');

    if (!member?.permissions.has(PermissionFlagsBits.MuteMembers) && !member?.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return message.reply('Nie masz uprawnień do wyciszania użytkowników.');
    }

    if (args.length === 0) {
        return message.reply('Podaj użytkownika! Użycie: !mute <@użytkownik> [czas_w_minutach]');
    }
    
    const userId = args[0].replace(/<@!?/g, '').replace(/>/g, '');
    const target = await guild.members.fetch(userId).catch(() => null);
    
    if (!target) {
        return message.reply('Nie znaleziono użytkownika na serwerze.');
    }

    if (target.id === member.id) {
        return message.reply('Nie możesz wykonać tej akcji na sobie.');
    }

    if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return message.reply('Bot nie ma uprawnień do zarządzania rolami.');
    }

    const muteRole = guild.roles.cache.get(MUTE_ROLE_ID);
    if (!muteRole) {
        return message.reply('Rola Muted o podanym ID nie istnieje na serwerze.');
    }

    if (target.roles.cache.has(muteRole.id)) {
        return message.reply('Ten użytkownik jest już wyciszony.');
    }

    await target.roles.add(muteRole);

    const time = parseInt(args[1]);
    if (time && time > 0) {
        setTimeout(async () => {
            if (target.roles.cache.has(muteRole.id)) {
                await target.roles.remove(muteRole).catch(() => {});
            }
        }, time * 60 * 1000);
        
        const embed = new EmbedBuilder()
            .setDescription(`Wyciszono **${target.user.tag}** na ${time} minut.`)
            .setColor(0x57F287);
        await message.reply({ embeds: [embed] });
    } else {
        const embed = new EmbedBuilder()
            .setDescription(`Wyciszono **${target.user.tag}**.`)
            .setColor(0x57F287);
        await message.reply({ embeds: [embed] });
    }
}
