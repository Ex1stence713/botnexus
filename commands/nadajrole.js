export const name = 'nadajrole';
export const description = 'Nadaje wybraną rolę wszystkim użytkownikom na serwerze';

export async function execute(message, args) {
    if (!message.member?.permissions.has('Administrator')) {
        return message.reply('Nie masz uprawnień administratora!');
    }
    
    if (args.length === 0) {
        return message.reply('Podaj nazwę roli! Użycie: !nadajrole <rola>');
    }
    
    if (!message.guild) {
        return message.reply('Ta komenda działa tylko na serwerze!');
    }
    
    const roleName = args.join(' ');
    const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
    
    if (!role) {
        return message.reply('Nie znaleziono takiej roli!');
    }

    await message.reply('📝 Trwa nadawanie roli...');

    try {
        const members = await message.guild.members.fetch({ limit: 1000, time: 30000 });
        let count = 0;

        for (const member of members.values()) {
            if (!member.user.bot && !member.roles.cache.has(role.id)) {
                try {
                    await member.roles.add(role);
                    count++;
                } catch (err) {
                    console.log(`Nie udało się nadać roli: ${member.user.tag}`);
                }
            }
        }

        await message.reply(`✅ Nadano rolę ${count} użytkownikom`);
    } catch (error) {
        console.error('Błąd:', error);
        await message.reply('Wystąpił błąd przy nadawaniu ról');
    }
}
