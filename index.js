import { Client, Collection, GatewayIntentBits, REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from 'dotenv';
import { setupErrorHandling } from './utils/errors.js';

dotenv.config();

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const token = (process.env.BOT_TOKEN || config.token || '').trim();
if (!token) {
  console.error('❌ Brak tokena bota.');
  process.exit(1);
}

// Funkcja do pobierania wszystkich plików .js/.cjs w folderze
function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.js') || file.endsWith('.cjs')) {
      arrayOfFiles.push(fullPath);
    }
  }

  return arrayOfFiles;
}

// Ładowanie komend
async function loadCommands(commandDir) {
  const commands = [];
  const commandMap = new Map();
  const categoryMap = new Map();

  const files = getAllFiles(commandDir);

  for (const filePath of files) {
    try {
      const imported = await import(pathToFileURL(filePath).href);
      const command = imported.default || imported;

      if (command && command.data && command.execute) {
        const category = path.basename(path.dirname(filePath)) || 'general';
        const json = command.data.toJSON();
        commands.push(json);
        commandMap.set(json.name, command);
        categoryMap.set(json.name, category);
      } else {
        console.warn(`⚠️ Plik ${filePath} nie zawiera 'data' lub 'execute' i zostanie pominięty.`);
      }
    } catch (err) {
      console.error(`Błąd podczas importu ${filePath}:`, err);
    }
  }

  return { commands, commandMap, categoryMap };
}

// Ładowanie eventów
async function loadEvents(eventsDir, client) {
  const files = getAllFiles(eventsDir);

  for (const filePath of files) {
    try {
      const imported = await import(pathToFileURL(filePath).href);
      const event = imported.default || imported;

      if (!event || !event.name || !event.execute) {
        console.warn(`⚠️ Plik ${filePath} nie zawiera 'name' lub 'execute' i zostanie pominięty.`);
        continue;
      }

      client.on(event.name, (...args) => event.execute(...args));
      console.log(`✅ Załadowano event: ${event.name}`);
    } catch (err) {
      console.error(`Błąd podczas importu eventu ${filePath}:`, err);
    }
  }
}

// Rejestracja globalnych komend
async function registerCommands(rest, clientId, commands) {
  if (!commands.length) {
    console.log('ℹ️ Brak komend do rejestracji.');
    return;
  }

  try {
    console.log(`🔁 Rejestruję ${commands.length} globalnych komend...`);
    const data = await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log(`✅ Zarejestrowano ${data.length ?? commands.length} globalnych komend.`);
  } catch (error) {
    if (error?.status === 401) console.error('❌ Token jest nieprawidłowy.');
    console.error('Szczegóły błędu:', error);
  }
}

async function main() {
  try {
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
      ]
    });

    client.commands = new Collection();
    client.categoryMap = new Map();

    setupErrorHandling(client);

    // 1️⃣ Komendy
    const { commands, commandMap, categoryMap } = await loadCommands(path.join(__dirname, 'commands'));
    client.categoryMap = categoryMap;
    for (const [name, cmd] of commandMap.entries()) client.commands.set(name, cmd);

    const rest = new REST({ version: '10' }).setToken(token);
    await registerCommands(rest, config.clientId, commands);

    // 2️⃣ Eventy
    await loadEvents(path.join(__dirname, 'events'), client);

    client.on('ready', () => {
      console.log(`🤖 Zalogowano jako ${client.user.tag}`);
      try {
        client.user.setPresence({
          activities: [{ name: 'Moderuję serwer 😎', type: 0 }],
          status: 'online'
        });
      } catch (err) {
        console.error("Błąd ustawiania statusu:", err);
      }
    });

    client.on('interactionCreate', async interaction => {
      if (!interaction.isChatInputCommand()) return;

      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (err) {
        console.error('Błąd podczas komendy:', err);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: '❌ Błąd podczas wykonywania komendy.', ephemeral: true });
        } else {
          await interaction.reply({ content: '❌ Błąd podczas wykonywania komendy.', ephemeral: true });
        }
      }
    });

    await client.login(token);

  } catch (err) {
    console.error('Błąd główny:', err);
    process.exit(1);
  }
}

main();
