export const name = 'control';
export const description = 'Zarządzanie botem (restart, wyłączenie)';

export async function execute(message, args) {
    if (!message.member?.permissions.has('Administrator')) {
        return message.reply('Nie masz uprawnień administratora!');
    }
    
    if (args.length === 0) {
        return message.reply('Podaj akcję! Użycie: !control <restart|stop|start>');
    }
    
    const action = args[0].toLowerCase();

    if (action === 'restart') {
        await message.reply('♻️ Restartuję bota...');
        
        setTimeout(async () => {
            try {
                await message.client.destroy();
            } catch (err) {
                console.error('Błąd przy zamykaniu klienta:', err);
            }
            process.exit(0);
        }, 1000);

    } else if (action === 'stop') {
        await message.reply('🛑 Wyłączam bota...');
        
        setTimeout(async () => {
            try {
                await message.client.destroy();
            } catch (err) {
                console.error('Błąd przy zamykaniu klienta:', err);
            }
            process.exit(0);
        }, 1000);

    } else if (action === 'start') {
        await message.reply('⚠️ Bot musi być uruchomiony zewnętrznie! Użyj swojego menedżera procesów (np. PM2, nodemon).');
    } else {
        await message.reply('Nieznana akcja! Użycie: !control <restart|stop|start>');
    }
}
