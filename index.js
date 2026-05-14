import {
    Client,
    Collection,
    GatewayIntentBits,
    REST,
    Routes,
    ActivityType,
    EmbedBuilder,
    ModalBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from 'dotenv';
import { setupVoiceEvents, setControlChannel } from './commands/autokanal.js';
import { startAutoTrivia } from './commands/trivia.js';

dotenv.config();

// ===========================
// KONFIGURACJA
// ===========================
const PREFIX = '!'; // Prefix komend
const LOG_CHANNEL_ID = '1499838771548651687';
const STATUS_CHANNEL_ID = '1502637789684957256';

// Wczytaj config
import config from './config.json' with { type: 'json' };
const VOICE_CONTROL_CHANNEL = config.voiceControlChannel || '1479630853054267412';

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
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();
client.categoryMap = new Map();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===========================
// PARTNERSTWO - DATA STORAGE
// ===========================
const partnershipsFile = path.join(__dirname, 'data', 'partnerships.json');

function loadPartnerships() {
    try {
        if (fs.existsSync(partnershipsFile)) {
            const data = fs.readFileSync(partnershipsFile, 'utf8');
            return JSON.parse(data).partnerships || [];
        }
    } catch (err) {
        console.error('❌ Błąd ładowania partnershipów', err);
    }
    return [];
}

function savePartnerships(partnerships) {
    try {
        fs.writeFileSync(partnershipsFile, JSON.stringify({ partnerships }, null, 2));
    } catch (err) {
        console.error('❌ Błąd zapisywania partnershipów', err);
    }
}

function getUserPartnershipCount(userId) {
    const partnerships = loadPartnerships();
    const userPartnerships = partnerships.filter(p => p.userId === userId);
    return userPartnerships.length;
}

function getUserRanking(userId) {
    const partnerships = loadPartnerships();
    const userCounts = {};
    
    partnerships.forEach(p => {
        userCounts[p.userId] = (userCounts[p.userId] || 0) + 1;
    });
    
    const sorted = Object.entries(userCounts)
        .sort((a, b) => b[1] - a[1]);
    
    const rank = sorted.findIndex(([id]) => id === userId) + 1;
    return rank || sorted.length;
}

function addPartnership(userId, username) {
    const partnerships = loadPartnerships();
    partnerships.push({
        userId,
        username,
        timestamp: Date.now()
    });
    savePartnerships(partnerships);
}

// Regex do wykrywania invite linków Discord
const inviteRegex = /(?:discord\.gg\/|discord(?:app)?\.com\/|discord\.gg\/)[a-zA-Z0-9]+/gi;

// ===========================
// AUTOMOD - KONFIGURACJA
// ===========================
const automodFile = path.join(__dirname, 'data', 'automod.json');

function loadAutomodConfig() {
    try {
        if (fs.existsSync(automodFile)) {
            const data = fs.readFileSync(automodFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('❌ Błąd ładowania automod:', err);
    }
    return { enabled: false };
}

function saveAutomodConfig(config) {
    try {
        fs.writeFileSync(automodFile, JSON.stringify(config, null, 2));
    } catch (err) {
        console.error('❌ Błąd zapisywania automod:', err);
    }
}

// Funkcja sprawdzająca czy użytkownik ma ignorowaną rolę
function hasIgnoredRole(message, config) {
    if (!message.member) return false;
    const memberRoles = message.member.roles.cache;
    for (const role of memberRoles.values()) {
        if (config.ignoredRoles?.includes(role.id)) return true;
    }
    return false;
}

// Funkcja sprawdzająca czy kanał jest ignorowany
function isIgnoredChannel(message, config) {
    return config.ignoredChannels?.includes(message.channel.id);
}

// Sprawdź czy wiadomość zawiera złe słowa
function containsBadWords(message, config) {
    const badWords = config.badWords || [];
    if (badWords.length === 0) return false;
    
    const content = message.content.toLowerCase();
    return badWords.some(word => content.includes(word.toLowerCase()));
}

// ===========================
// REKURENCYJNE ŁADOWANIE KOMEND
// ===========================
async function loadCommands() {

    const commandsPath = path.join(__dirname, 'commands');

    if (!fs.existsSync(commandsPath)) {
        console.warn('⚠️ Folder commands nie istnieje.');
        return { commandsJSON: [], loadedNames: [] };
    }

    const commandsJSON = [];
    const loadedNames = [];
    const seenCommands = new Set(); // Zapobiega duplikatom

    // Funkcja do rekurencyjnego przeszukiwania katalogów
    async function scanDirectory(dirPath, category = 'general') {
        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const item of items) {
            const itemPath = path.join(dirPath, item.name);
            
            if (item.isDirectory()) {
                // Rekurencyjnie przeszukaj podkatalog (np. commands/admin/)
                await scanDirectory(itemPath, item.name);
            } else if (item.name.endsWith('.js') || item.name.endsWith('.cjs')) {
                const filePath = pathToFileURL(itemPath).href;
                
                try {
                    const module = await import(filePath);
                    const command = module.default || module;

                    // Obsługa komend prefix (!)
                    if (command.name && command.execute) {
                        const cmdName = command.name.toLowerCase();
                        // Pomijaj duplikaty komend
                        if (seenCommands.has(cmdName)) {
                            console.warn(`⚠️ Pomijam duplikat komendy: ${cmdName}`);
                            continue;
                        }
                        seenCommands.add(cmdName);
                        
                        client.commands.set(cmdName, command);
                        client.categoryMap.set(cmdName, category);
                        loadedNames.push(`${PREFIX}${cmdName}`);
                    }
                    // Obsługa komend slash (dla kompatybilności wstecznej)
                    else if (command.data && command.execute) {
                        const cmdName = command.data.name.toLowerCase();
                        // Pomijaj duplikaty komend
                        if (seenCommands.has(cmdName)) {
                            console.warn(`⚠️ Pomijam duplikat komendy: ${cmdName}`);
                            continue;
                        }
                        seenCommands.add(cmdName);
                        
                        client.commands.set(cmdName, command);
                        client.categoryMap.set(cmdName, category);
                        commandsJSON.push(command.data.toJSON());
                        loadedNames.push(`/${cmdName}`);
                    }
                } catch (err) {
                    console.error(`❌ Błąd ładowania ${item.name}`, err);
                }
            }
        }
    }

    await scanDirectory(commandsPath);

    console.log(`✅ Łącznie załadowano ${loadedNames.length} komend`);

    return { commandsJSON, loadedNames };
}

// ===========================
// REJESTRACJA KOMEND
// ===========================
async function registerCommands(commandsJSON) {

    const rest = new REST({ version: '10' }).setToken(token);

    try {

        console.log('🔄 Rejestrowanie komend...');

        // Najpierw wyczyść wszystkie komendy (zapobiega duplikatom)
        try {
            await rest.put(Routes.applicationCommands(clientId), { body: [] });
            console.log('✅ Wyczyszczono stare komendy');
        } catch (e) {
            console.log('⚠️ Nie udało się wyczyścić komend (mogą już nie istnieć)');
        }

        // Teraz zarejestruj nowe komendy
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commandsJSON }
        );

        console.log(`✅ Zarejestrowano ${commandsJSON.length} komend`);

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

        // Obliczenia
        const uptimeMs = client.uptime;
        const days = Math.floor(uptimeMs / 86400000);
        const hours = Math.floor((uptimeMs % 86400000) / 3600000);
        const mins = Math.floor((uptimeMs % 3600000) / 60000);
        const ping = client.ws.ping;
        
        // Kolor zależny od pingu
        let statusColor = '#2ecc71'; // zielony
        let statusEmoji = '🟢';
        let statusText = 'Online';
        let pingBar = '🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩';
        
        if (ping >= 200) {
            statusColor = '#e74c3c'; // czerwony
            statusEmoji = '🔴';
            statusText = '⚠️ Lag';
            pingBar = '🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥';
        } else if (ping >= 150) {
            statusColor = '#f39c12'; // pomarańczowy
            statusEmoji = '🟠';
            statusText = '🟡 Online';
            pingBar = '🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧';
        } else if (ping >= 100) {
            statusColor = '#f1c40f'; // żółty
            statusEmoji = '🟡';
            statusText = 'Online';
            // Częściowo zielony, częściowo żółty
            pingBar = '🟩🟩🟩🟩🟩🟩🟩🟨🟨🟨';
        } else if (ping >= 50) {
            // Głównie zielony z małym żółtym
            pingBar = '🟩🟩🟩🟩🟩🟩🟩🟩🟩🟨';
        }
        
        // Format uptime
        const uptimeStr = days > 0 
            ? `${days}d ${hours}h ${mins}m` 
            : `${hours}h ${mins}m`;
        
        // Pasek uptime
        const uptimePercent = Math.min(100, (uptimeMs % 86400000) / 8640000);
        const uptimeBarLength = 10;
        const uptimeBars = Math.round((uptimePercent / 100) * uptimeBarLength);
        const uptimeBar = '█'.repeat(uptimeBars) + '░'.repeat(uptimeBarLength - uptimeBars);

        // Statystyki
        const guilds = client.guilds.cache.size;
        const users = client.users.cache.size;
        const channels = client.channels.cache.size;
        
        // Pobierz info o największym serwerze
        let biggestGuild = 'Brak';
        let biggestGuildMembers = 0;
        client.guilds.cache.forEach(guild => {
            if (guild.memberCount > biggestGuildMembers) {
                biggestGuildMembers = guild.memberCount;
                biggestGuild = guild.name;
    }
});

// ===========================
// KOMENDY PREFIX (!) - OBSŁUGA
// ===========================
client.on('messageCreate', async message => {
    // Ignoruj boty i DM
    if (message.author.bot || !message.guild) return;
    
    // Sprawdź prefix
    if (!message.content.startsWith(PREFIX)) return;
    
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    const command = client.commands.get(commandName);
    if (!command) return;
    
    try {
        await command.execute(message, args);
    } catch (err) {
        console.error(`❌ Błąd komendy ${commandName}:`, err);
        try {
            await message.reply('❌ Wystąpił błąd podczas wykonania komendy.');
        } catch (e) {
            console.error('❌ Nie można wysłać wiadomości błędu:', e);
        }
    }
});

// ===========================
// INIT - ŁADOWANIE KOMEND
// ===========================
(async () => {
    try {
        console.log('🔄 Ładowanie komend...');
        const { commandsJSON, loadedNames } = await loadCommands();
        
        console.log(`✅ Załadowano komendy: ${loadedNames.join(', ')}`);
        
        // Rejestruj tylko komendy slash (jeśli są)
        if (commandsJSON.length > 0) {
            await registerCommands(commandsJSON);
        }
        
        console.log('✅ Bot gotowy do użycia!');
    } catch (err) {
        console.error('❌ Błąd inicjalizacji:', err);
    }
})();

client.login(token);

})();
