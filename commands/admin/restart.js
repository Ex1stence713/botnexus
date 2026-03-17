export const name = 'restart';
export const description = 'Restartuje bota (wymaga uprawnień Administrator)';

export async function execute(message, args) {
    if (!message.member?.permissions.has('Administrator')) {
        return message.reply('Nie masz uprawnień administratora!');
    }
    
    await message.reply('♻️ Restartuję bota... (zaraz się wyłączę)');

    setTimeout(async () => {
        try {
            await message.client.destroy();
        } catch (err) {
            console.error('Błąd przy zamykaniu klienta przed restartem:', err);
        }

        process.exit(0);
    }, 1000);
}
