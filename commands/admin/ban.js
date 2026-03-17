export const name = 'ban';
export const description = 'Banuje użytkownika';

export async function execute(message, args) {
    if (!message.member?.permissions.has('BanMembers')) {
        return message.reply('Nie masz uprawnień do banowania!');
    }
    
    if (args.length === 0) {
        return message.reply('Podaj użytkownika! Użycie: !ban <@użytkownik> [powód]');
    }
    
    if (!message.guild) {
        return message.reply('Ta komenda działa tylko na serwerze!');
    }
    
    const userId = args[0].replace(/<@!?/g, '').replace(/>/g, '');
    let target;
    try {
        target = await message.client.users.fetch(userId);
    } catch (e) {
        return message.reply('Nie znaleziono użytkownika!');
    }
    
    const member = await message.guild.members.fetch(userId).catch(() => null);
    if (!member) {
        return message.reply('Nie znaleziono użytkownika na serwerze.');
    }
    
    const reason = args.slice(1).join(' ') || `Zbanowany przez ${message.author.tag}`;
    
    try {
        await member.ban({ reason: reason });
        await message.reply(`🔨 ${target.tag} został zbanowany. Powód: ${reason}`);
    } catch (err) {
        await message.reply(`❌ Błąd: ${err.message}`);
    }
}
