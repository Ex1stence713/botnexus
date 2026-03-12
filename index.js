import {
    Client,
    Collection,
    GatewayIntentBits,
    REST,
    Routes,
    ActivityType,
    EmbedBuilder
} from 'discord.js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// ===========================
// KONFIGURACJA
// ===========================
const LOG_CHANNEL_ID = 'TU_WLEJ_ID_LOGOW';
const STATUS_CHANNEL_ID = 'TU_WLEJ_ID_STATUSU';

const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token) {
    console.error('❌ Brak BOT_TOKEN w pliku .env');
    process.exit(1);
}

if (!clientId) {
    console.error('❌ Brak CLIENT_ID w pliku .env');
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildModeration
    ]
});

client.commands = new Collection();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===========================
// LOADER KOMEND
// ===========================
async function loadCommands() {

    const commandsPath = path.join(__dirname, 'commands');

    if (!fs.existsSync(commandsPath)) {
        console.warn('⚠️ Folder commands nie istnieje.');
        return { commandsJSON: [], loadedNames: [] };
    }

    const commandFiles = fs.readdirSync(commandsPath)
        .filter(file => file.endsWith('.js') || file.endsWith('.cjs'));

    const commandsJSON = [];
    const loadedNames = [];

    for (const file of commandFiles) {

        const filePath = pathToFileURL(path.join(commandsPath, file)).href;

        try {

            const module = await import(filePath);
            const command = module.default || module;

            if (command.data && command.execute) {

                client.commands.set(command.data.name, command);
                commandsJSON.push(command.data.toJSON());
                loadedNames.push(`/${command.data.name}`);

            }

        } catch (err) {

            console.error(`❌ Błąd ładowania ${file}`, err);

        }

    }

    return { commandsJSON, loadedNames };
}

// ===========================
// REJESTRACJA KOMEND
// ===========================
async function registerCommands(commandsJSON) {

    const rest = new REST({ version: '10' }).setToken(token);

    try {

        console.log('🔄 Rejestrowanie komend...');

        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commandsJSON }
        );

        console.log('✅ Komendy zarejestrowane');

    } catch (err) {

        console.error('❌ Błąd rejestracji komend', err);

    }

}

// ===========================
// STATUS PUBLICZNY
// ===========================
async function updatePublicStatus() {

    try {

        const channel = await client.channels.fetch(STATUS_CHANNEL_ID).catch(() => null);
        if (!channel) return;

        const uptime = Math.floor(client.uptime / 60000);
        const hours = Math.floor(uptime / 60);
        const mins = uptime % 60;

        const embed = new EmbedBuilder()
            .setTitle('📊 Status Bota')
            .setColor(client.ws.ping < 100 ? '#2ecc71' : '#f1c40f')
            .addFields(
                { name: 'Status', value: 'Online', inline: true },
                { name: 'Ping', value: `${client.ws.ping}ms`, inline: true },
                { name: 'Uptime', value: `${hours}h ${mins}m`, inline: true }
            )
            .setTimestamp();

        const messages = await channel.messages.fetch({ limit: 10 });
        const botMsg = messages.find(m => m.author.id === client.user.id);

        if (botMsg) {
            await botMsg.edit({ embeds: [embed] });
        } else {
            await channel.send({ embeds: [embed] });
        }

    } catch (err) {

        console.error('❌ Błąd statusu', err);

    }

}

// ===========================
// LOGI
// ===========================
async function sendLog(embed) {

    try {

        const channel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
        if (!channel) return;

        channel.send({ embeds: [embed] });

    } catch {}

}

// ===========================
// EVENTY
// ===========================
client.on('messageDelete', (m) => {

    if (m.author?.bot) return;

    const embed = new EmbedBuilder()
        .setTitle('🗑️ Wiadomość usunięta')
        .setColor('Red')
        .addFields(
            { name: 'Autor', value: m.author?.tag || 'Nieznany', inline: true },
            { name: 'Kanał', value: `${m.channel}`, inline: true },
            { name: 'Treść', value: m.content || 'Embed / plik' }
        )
        .setTimestamp();

    sendLog(embed);

});

client.on('guildMemberAdd', (member) => {

    const embed = new EmbedBuilder()
        .setTitle('📥 Nowy użytkownik')
        .setColor('Green')
        .setDescription(`${member.user.tag} dołączył`)
        .setTimestamp();

    sendLog(embed);

});

// ===========================
// START
// ===========================
client.once('ready', async () => {

    console.log(`🚀 Zalogowano jako ${client.user.tag}`);

    client.user.setPresence({
        activities: [{ name: '/pomoc', type: ActivityType.Listening }],
        status: 'online'
    });

    updatePublicStatus();
    setInterval(updatePublicStatus, 60000);

});

// ===========================
// INTERAKCJE
// ===========================
client.on('interactionCreate', async interaction => {

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {

        await command.execute(interaction);

    } catch (err) {

        console.error(err);

    }

});

// ===========================
// INIT
// ===========================
(async () => {

    const { commandsJSON } = await loadCommands();
    await registerCommands(commandsJSON);

    client.login(token);

})();
