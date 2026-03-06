import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import config from './config.json' assert { type: 'json' };

const commands = [];
const commandsPath = './commands';
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(`[UWAGA] ${file} nie zawiera poprawnego exportu.`);
  }
}

const rest = new REST({ version: '10' }).setToken(config.token);

try {
  console.log(`⏳ Rejestracja ${commands.length} komend...`);

  const data = await rest.put(
    Routes.applicationGuildCommands(config.clientId, config.guildId),
    { body: commands }
  );

  console.log(`✅ Pomyślnie zarejestrowano ${data.length} komend.`);
} catch (error) {
  console.error(error);
}
