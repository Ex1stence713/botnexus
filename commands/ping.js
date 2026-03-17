export const name = 'ping';
export const description = 'Sprawdź ping bota';

export async function execute(message, args) {
    const ping = Math.round(message.client.ws.ping);
    await message.reply(`🏓 Pong! Ping: ${ping}ms`);
}
