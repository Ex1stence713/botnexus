export const name = 'clear';
export const description = 'Czyści wiadomości';

export async function execute(message, args) {
    if (!message.member?.permissions.has('ManageMessages')) {
        return message.reply('Nie masz uprawnień do zarządzania wiadomościami!');
    }
    
    if (args.length === 0) {
        return message.reply('Podaj ilość wiadomości! Użycie: !clear <ilość>');
    }
    
    const amount = parseInt(args[0]);
    
    if (isNaN(amount) || amount < 1 || amount > 100) {
        return message.reply('Podaj liczbę od 1 do 100!');
    }
    
    try {
        await message.channel.bulkDelete(amount, true);
        await message.reply(`🧹 Usunięto ${amount} wiadomości.`);
    } catch (err) {
        await message.reply(`❌ Błąd: ${err.message}`);
    }
}
