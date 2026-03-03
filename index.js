const { Client, IntentsBitField, Collection } = require('discord.js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

const PREFIX = '!';
client.commands = new Collection();

// Ładowanie komend z folderu commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  let command = require(filePath);
  // If module uses ES export default, unwrap it
  if (command && command.default) {
    command = command.default;
  }
  if (command.name) {
    client.commands.set(command.name, command);
    console.log(`✅ Załadowana komenda: ${command.name}`);
  }
}

client.on('ready', () => {
  console.log(`✅ Bot zalogował się jako ${client.user.tag}`);
  console.log(`📦 Załadowanych komend: ${client.commands.size}`);
});

client.on('messageCreate', (message) => {
  if (!message.content.startsWith(PREFIX) || message.author.bot) {
    return;
  }

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  if (!client.commands.has(commandName)) {
    return;
  }

  const command = client.commands.get(commandName);

  try {
    command.execute(message, args, client);
  } catch (error) {
    console.error(error);
    message.reply('❌ Wykonanie komendy nie powiodło się!');
  }
});

client.login(process.env.TOKEN);
