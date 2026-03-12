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
const LOG_CHANNEL_ID = '1479629372158902373';
const STATUS_CHANNEL_ID = '1479630853054267412';

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

                    if (command.data && command.execute) {
                        // Pomijaj duplikaty komend
                        if (seenCommands.has(command.data.name)) {
                            console.warn(`⚠️ Pomijam duplikat komendy: ${command.data.name}`);
                            continue;
                        }
                        seenCommands.add(command.data.name);
                        
                        client.commands.set(command.data.name, command);
                        client.categoryMap.set(command.data.name, category);
                        commandsJSON.push(command.data.toJSON());
                        loadedNames.push(`/${command.data.name}`);
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
        
        if (ping >= 200) {
            statusColor = '#e74c3c'; // czerwony
            statusEmoji = '🔴';
            statusText = 'Lag';
        } else if (ping >= 100) {
            statusColor = '#f1c40f'; // żółty
            statusEmoji = '🟡';
            statusText = 'Online';
        }
        
        // Format uptime
        const uptimeStr = days > 0 
            ? `${days}d ${hours}h ${mins}m` 
            : `${hours}h ${mins}m`;

        const embed = new EmbedBuilder()
            .setTitle(`${statusEmoji} Status Bota`)
            .setColor(statusColor)
            .setThumbnail(client.user.displayAvatarURL({ size: 128 }))
            .addFields(
                { name: '💠 Status', value: statusText, inline: true },
                { name: '📡 Ping', value: `\`${ping}ms\``, inline: true },
                { name: '⏱️ Uptime', value: `\`${uptimeStr}\``, inline: true },
                { name: '👥 Serwery', value: `\`${client.guilds.cache.size}\``, inline: true },
                { name: '👤 Użytkownicy', value: `\`${client.users.cache.size}\``, inline: true },
                { name: '📝 Kanały', value: `\`${client.channels.cache.size}\``, inline: true }
            )
            .setFooter({ 
                text: `Nexus Bot • Aktualizacja: ${new Date().toLocaleTimeString('pl-PL')}`,
                iconURL: client.user.displayAvatarURL({ size: 32 })
            })
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
// EVENTY - messageDelete
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

// ===========================
// PARTNERSTWO - AUTO DETEKCJA I ODPOWIEDŹ
// ===========================
client.on('messageCreate', async (message) => {
    // Ignoruj wiadomości od botów
    if (message.author.bot) return;
    
    // Sprawdź czy wiadomość zawiera invite link
    const hasInvite = inviteRegex.test(message.content);
    
    // Reset regex lastIndex
    inviteRegex.lastIndex = 0;
    
    if (hasInvite) {
        // Dodaj partnership
        addPartnership(message.author.id, message.author.tag);
        
        // Pobierz statystyki
        const count = getUserPartnershipCount(message.author.id);
        const ranking = getUserRanking(message.author.id);
        
        // Wyślij odpowiedź
        const embed = new EmbedBuilder()
            .setTitle('🤝 Dziękujemy za partnerstwo!')
            .setColor('#5865F2')
            .setDescription(`Dziękujemy za polecenie serwera, ${message.author}! 🎉`)
            .addFields(
                { name: 'Twoja ilość partnerstw', value: `${count}`, inline: true },
                { name: 'Twój ranking', value: `#${ranking}`, inline: true }
            )
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
        
        // Loguj partnership
        const logEmbed = new EmbedBuilder()
            .setTitle('🤝 Nowe partnerstwo')
            .setColor('Green')
            .addFields(
                { name: 'Użytkownik', value: message.author.tag, inline: true },
                { name: 'Ilość', value: `${count}`, inline: true },
                { name: 'Kanał', value: `${message.channel}`, inline: true }
            )
            .setTimestamp();
        
        sendLog(logEmbed);
    }
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
    if (!command) {
        console.log(`❌ Komenda ${interaction.commandName} nie została znaleziona`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (err) {
        console.error(`❌ Błąd wykonania komendy ${interaction.commandName}:`, err);
        
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: '❌ Wystąpił błąd podczas wykonania tej komendy.', ephemeral: true });
            } else {
                await interaction.reply({ content: '❌ Wystąpił błąd podczas wykonania tej komendy.', ephemeral: true });
            }
        } catch (e) {
            console.error('❌ Nie można wysłać wiadomości błędu:', e);
        }
    }

});

// ===========================
// INIT
// ===========================
(async () => {

    const { commandsJSON } = await loadCommands();
    await registerCommands(commandsJSON);

    // ===========================
    // ŁADOWANIE EVENTÓW
    // ===========================
    const eventsPath = path.join(__dirname, 'events');
    
    if (fs.existsSync(eventsPath)) {
        const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
        
        for (const file of eventFiles) {
            const filePath = pathToFileURL(path.join(eventsPath, file)).href;
            const event = await import(filePath);
            const evt = event.default || event;
            
            if (evt.name && evt.execute) {
                if (evt.once) {
                    client.once(evt.name, evt.execute);
                } else {
                    client.on(evt.name, evt.execute);
                }
                console.log(`✅ Załadowano event: ${evt.name}`);
            }
        }
    }

    client.login(token);

})();
