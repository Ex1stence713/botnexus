export const name = 'przypomnij-admin';
export const description = 'Przypomnienie o spotkaniu na PV do całej administracji';

const ADMIN_ROLE_ID = "1463651990331457546";

export async function execute(message, args) {
    if (!message.guild) {
        return message.reply('Ta komenda działa tylko na serwerze!');
    }
    
    if (args.length < 3) {
        return message.reply('Podaj datę, godzinę i treść! Użycie: !przypomnij-admin <DD.MM.RRRR> <HH:MM> <treść>');
    }
    
    const dateStr = args[0];
    const timeStr = args[1];
    const content = args.slice(2).join(' ');

    const role = message.guild.roles.cache.get(ADMIN_ROLE_ID);
    if (!role) {
        return message.reply('Nie znaleziono rangi administracji.');
    }

    const [day, month, year] = dateStr.split(".");
    const [hour, minute] = timeStr.split(":");

    const remindDate = new Date(year, month - 1, day, hour, minute);
    const delay = remindDate.getTime() - Date.now();

    if (isNaN(delay) || delay <= 0) {
        return message.reply('Podano nieprawidłową datę lub godzinę.');
    }

    await message.reply(`Przypomnienie dla administracji ustawione na ${dateStr} ${timeStr}.`);

    setTimeout(async () => {
        for (const member of role.members.values()) {
            try {
                await member.send(
                    `📅 Przypomnienie o spotkaniu\n` +
                    `🕒 ${dateStr} ${timeStr}\n\n` +
                    content
                );
            } catch {
                console.log(`Nie można wysłać DM do ${member.user.tag}`);
            }
        }
    }, delay);
}
