export const name = 'dajrange';
export const description = 'Nadaje rangę o podanym ID wszystkim członkom serwera.';

export async function execute(message, args) {
    if (!message.member?.permissions.has('Administrator')) {
        return message.reply('Nie masz uprawnień administratora!');
    }
    
    if (args.length === 0) {
        return message.reply('Podaj ID roli! Użycie: !dajrange <role_id>');
    }
    
    if (!message.guild) {
        return message.reply('Ta komenda działa tylko na serwerze!');
    }
    
    const roleId = args[0];
    const guild = message.guild;
    const role = guild.roles.cache.get(roleId);

    if (!role) {
        return message.reply('Nie znaleziono rangi o podanym ID.');
    }

    await message.reply('Nadaję rangę wszystkim członkom...');

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

    await message.reply(`Ranga została nadana ${success} członkom. Niepowodzenia: ${fail}.`);
}
