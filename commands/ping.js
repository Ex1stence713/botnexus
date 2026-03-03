module.exports = {
  name: 'ping',
  description: 'Sprawdza ping bota',
  execute(message, args, client) {
    message.reply(`🏓 Pong! Ping: ${client.ws.ping}ms`);
  },
};
