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

        const embed = new EmbedBuilder()
            .setTitle(`${statusEmoji} Status Bota - Nexus`)
            .setColor(statusColor)
            .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
            .setDescription(`**${statusText}** | Wersja: 1.0.0`)
            .addFields(
                { name: `${statusEmoji} Status`, value: `\`${statusText}\``, inline: true },
                { name: '📡 Ping', value: `\`${ping}ms\` ${pingBar}`, inline: true },
                { name: '⏱️ Uptime', value: `\`${uptimeStr}\`
${uptimeBar}`, inline: true },
                { name: '─────────────────', value: '**📊 Statystyki:**', inline: false },
                { name: '🏢 Serwery', value: `\`${guilds}\``, inline: true },
                { name: '👥 Użytkownicy', value: `\`${users}\``, inline: true },
                { name: '💬 Kanały', value: `\`${channels}\``, inline: true },
                { name: '👑 Największy serwer', value: `\`${biggestGuild}\` (${biggestGuildMembers} członków)`, inline: false }
            )
            .setFooter({ 
                text: `Nexus Bot • Zaktualizowano: ${new Date().toLocaleString('pl-PL')}`,
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
    
    // ===========================
    // AUTOMOD - FILTR SŁÓW I ZAPROSZEŃ
    // ===========================
    const automod = loadAutomodConfig();
    
    // Sprawdź czy automod jest włączony
    if (!automod.enabled) return;
    
    // Sprawdź ignorowane kanały i role
    if (isIgnoredChannel(message, automod)) return;
    if (hasIgnoredRole(message, automod)) return;
    
    // Sprawdź czy wiadomość zawiera invite link
    inviteRegex.lastIndex = 0;
    const hasInviteLink = inviteRegex.test(message.content);
    
    // Anti-Invite: usuń wiadomość z zaproszeniem
    if (hasInviteLink && automod.antiInvite) {
        if (automod.deleteInviteMessage) {
            try {
                await message.delete();
                
                const warnEmbed = new EmbedBuilder()
                    .setTitle('⚠️ Zaproszenia są zabronione')
                    .setColor('Red')
                    .setDescription(`${message.author}, nie wolno publikować linków do innych serwerów!`)
                    .setFooter({ text: 'Zaproszenie zostało usunięte' });
                
                await message.channel.send({ embeds: [warnEmbed] }).then(msg => {
                    setTimeout(() => msg.delete().catch(() => {}), 5000);
                });
                
                // Loguj
                const logEmbed = new EmbedBuilder()
                    .setTitle('🛡️ Usunięto zaproszenie')
                    .setColor('Orange')
                    .addFields(
                        { name: 'Użytkownik', value: message.author.tag, inline: true },
                        { name: 'Kanał', value: `${message.channel}`, inline: true }
                    )
                    .setTimestamp();
                sendLog(logEmbed);
                
            } catch (err) {
                console.error('❌ Błąd usuwania zaproszenia:', err);
            }
        }
        return; // Przerwij bo wiadomość została usunięta
    }
    
    // Filtr słów: sprawdź złe słowa
    if (containsBadWords(message, automod)) {
        if (automod.deleteBadMessage) {
            try {
                await message.delete();
                
                const warnEmbed = new EmbedBuilder()
                    .setTitle('⚠️ Niedozwolone słowo')
                    .setColor('Red')
                    .setDescription(`${message.author}, Twoja wiadomość zawiera niedozwolone słowa!`)
                    .setFooter({ text: 'Wiadomość została usunięta' });
                
                await message.channel.send({ embeds: [warnEmbed] }).then(msg => {
                    setTimeout(() => msg.delete().catch(() => {}), 5000);
                });
                
                // Loguj
                const logEmbed = new EmbedBuilder()
                    .setTitle('🛡️ Usunięto wiadomość (złe słowo)')
                    .setColor('Red')
                    .addFields(
                        { name: 'Użytkownik', value: message.author.tag, inline: true },
                        { name: 'Kanał', value: `${message.channel}`, inline: true }
                    )
                    .setTimestamp();
                sendLog(logEmbed);
                
            } catch (err) {
                console.error('❌ Błąd usuwania wiadomości:', err);
            }
        }
    }
});

// ===========================
// START
// ===========================
client.once('ready', async () => {

    console.log(`🚀 Zalogowano jako ${client.user.tag}`);

    client.user.setPresence({
        activities: [{ name: `${PREFIX}pomoc`, type: ActivityType.Listening }],
        status: 'online'
    });

    updatePublicStatus();
    setInterval(updatePublicStatus, 60000);
    
    // Setup autokanały
    setupVoiceEvents(client);
    setControlChannel(VOICE_CONTROL_CHANNEL);
    
    // Uruchom auto-trivia
    startAutoTrivia(client);

});

// ===========================
// INTERAKCJE - PREFIX COMMANDS
// ===========================
client.on('messageCreate', async (message) => {
    // Ignoruj wiadomości od botów
    if (message.author.bot) return;
    
    // Sprawdź czy wiadomość zaczyna się od prefixu
    if (!message.content.startsWith(PREFIX)) return;
    
    // Usuń prefix i pobierz argumenty
    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();
    
    // Znajdź komendę
    const command = client.commands.get(commandName);
    if (!command) return;
    
    // Sprawdź czy komenda ma poprawną strukturę prefix
    if (!command.execute) {
        console.log(`❌ Komenda ${commandName} nie ma funkcji execute`);
        return;
    }
    
    try {
        await command.execute(message, args);
    } catch (err) {
        console.error(`❌ Błąd wykonania komendy ${commandName}:`, err);
        
        try {
            await message.reply('❌ Wystąpił błąd podczas wykonania tej komendy.');
        } catch (e) {
            console.error('❌ Nie można wysłać wiadomości błędu:', e);
        }
    }
});

// ===========================
// INTERAKCJE - SLASH COMMANDS (opcjonalne, wyłączone)
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
// INTERAKCJE - BUTTONY (weryfikacja)
// ===========================
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    
    if (interaction.customId === 'verify_button') {
        try {
            // Importuj konfigurację weryfikacji
            const { loadVerificationConfig, saveVerificationConfig, generateCaptcha } = await import('./commands/weryfikacja.js');
            const config = await loadVerificationConfig();
            
            if (!config.enabled) {
                return interaction.reply({ content: '❌ System weryfikacji jest wyłączony!', ephemeral: true });
            }
            
            const { guild, user, member } = interaction;
            
            // Sprawdź czy użytkownik jest już zweryfikowany
            if (config.verifiedUsers[user.id]) {
                return interaction.reply({ content: '✅ Jesteś już zweryfikowany!', ephemeral: true });
            }
            
            // Sprawdź cooldown
            const lastAttempt = config.verifiedUsers[user.id]?.lastAttempt || 0;
            const cooldownEnd = lastAttempt + (config.verificationCooldown * 1000);
            if (Date.now() < cooldownEnd) {
                const remaining = Math.ceil((cooldownEnd - Date.now()) / 1000);
                return interaction.reply({ content: `⏰ Poczekaj ${remaining} sekund przed kolejną próbą!`, ephemeral: true });
            }
            
            // Sprawdź max prób
            const attempts = config.verifiedUsers[user.id]?.attempts || 0;
            if (attempts >= config.maxAttempts) {
                return interaction.reply({ content: `❌ Przekroczono maksymalną liczbę prób (${config.maxAttempts})! Skontaktuj się z administratorem.`, ephemeral: true });
            }
            
            // Jeśli wymagana CAPTCHA
            if (config.requireCaptcha) {
                const captcha = generateCaptcha(config.captchaDifficulty);
                
                // Zapisz CAPTCHA tymczasowo
                if (!config.verifiedUsers[user.id]) {
                    config.verifiedUsers[user.id] = {};
                }
                config.verifiedUsers[user.id].captcha = captcha;
                config.verifiedUsers[user.id].lastAttempt = Date.now();
                config.verifiedUsers[user.id].attempts = (config.verifiedUsers[user.id].attempts || 0) + 1;
                await saveVerificationConfig(config);
                
                // Utwórz modal z CAPTCHA
                const modal = new ModalBuilder()
                    .setCustomId('verify_captcha_modal')
                    .setTitle('Weryfikacja CAPTCHA');
                
                const captchaInput = new TextInputBuilder()
                    .setCustomId('captcha_input')
                    .setLabel(`Wpisz kod: ${captcha}`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);
                
                const firstActionRow = new ActionRowBuilder().addComponents(captchaInput);
                modal.addComponents(firstActionRow);
                
                return interaction.showModal(modal);
            }
            
            // Bez CAPTCHA - od razu weryfikuj
            await verifyUser(interaction, config);
            
        } catch (error) {
            console.error('[Weryfikacja] Błąd:', error);
            return interaction.reply({ content: '❌ Wystąpił błąd podczas weryfikacji!', ephemeral: true });
        }
    }

    // Obsługa przycisków ticketów
    if (interaction.customId.startsWith('ticket_')) {
        try {
            const { handleTicketButton, handleTicketCloseButton } = await import('./commands/ticket.js');
            
            if (interaction.customId.startsWith('ticket_close_')) {
                await handleTicketCloseButton(interaction);
            } else if (interaction.customId.startsWith('ticket_')) {
                await handleTicketButton(interaction);
            }
        } catch (error) {
            console.error('[Ticket] Błąd:', error);
            return interaction.reply({ content: '❌ Wystąpił błąd podczas tworzenia ticketu!', ephemeral: true });
        }
        return;
    }
});

// ===========================
// INTERAKCJE - MODALE (weryfikacja CAPTCHA)
// ===========================
client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;
    
    if (interaction.customId === 'verify_captcha_modal') {
        try {
            const { loadVerificationConfig, saveVerificationConfig } = await import('./commands/weryfikacja.js');
            const config = await loadVerificationConfig();
            
            const { user, guild } = interaction;
            const captchaInput = interaction.fields.getTextInputValue('captcha_input');
            
            // Sprawdź CAPTCHA
            const userCaptcha = config.verifiedUsers[user.id]?.captcha;
            if (!userCaptcha || captchaInput !== userCaptcha) {
                // Zwiększ liczbę prób
                if (!config.verifiedUsers[user.id]) {
                    config.verifiedUsers[user.id] = {};
                }
                config.verifiedUsers[user.id].attempts = (config.verifiedUsers[user.id].attempts || 0) + 1;
                config.verifiedUsers[user.id].lastAttempt = Date.now();
                await saveVerificationConfig(config);
                
                const remaining = config.maxAttempts - config.verifiedUsers[user.id].attempts;
                return interaction.reply({ content: `❌ Nieprawidłowy kod CAPTCHA! Pozostało prób: ${remaining}`, ephemeral: true });
            }
            
            // CAPTCHA poprawna - weryfikuj użytkownika
            await verifyUser(interaction, config);
            
        } catch (error) {
            console.error('[Weryfikacja CAPTCHA] Błąd:', error);
            return interaction.reply({ content: '❌ Wystąpił błąd podczas weryfikacji!', ephemeral: true });
        }
    }
});

// Funkcja weryfikacji użytkownika
async function verifyUser(interaction, config) {
    const { guild, user, member } = interaction;
    
    try {
        // Pobierz rolę zweryfikowanych
        const verifiedRole = guild.roles.cache.get(config.verifiedRoleId);
        if (!verifiedRole) {
            return interaction.reply({ content: '❌ Rola zweryfikowanych nie istnieje!', ephemeral: true });
        }
        
        // Sprawdź hierarchię ról
        if (guild.members.me.roles.highest.position <= verifiedRole.position) {
            return interaction.reply({ content: '❌ Bot nie może nadać tej roli!', ephemeral: true });
        }
        
        // Nadaj rolę
        await member.roles.add(verifiedRole);
        
        // Zapisz weryfikację
        config.verifiedUsers[user.id] = {
            verifiedAt: Date.now(),
            username: user.tag
        };
        await saveVerificationConfig(config);
        
        // Odpowiedz użytkownikowi
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Weryfikacja zakończona!')
            .setDescription(`Pomyślnie zweryfikowano! Rola ${verifiedRole} została nadana.`)
            .setColor(0x57F287)
            .setTimestamp();
        
        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
        
        // Loguj weryfikację
        if (config.logChannelId) {
            const logChannel = guild.channels.cache.get(config.logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('🔐 Nowa weryfikacja')
                    .setColor(0x57F287)
                    .addFields(
                        { name: 'Użytkownik', value: user.tag, inline: true },
                        { name: 'ID', value: user.id, inline: true },
                        { name: 'Data', value: new Date().toLocaleString('pl-PL'), inline: true }
                    )
                    .setTimestamp();
                
                logChannel.send({ embeds: [logEmbed] }).catch(() => {});
            }
        }
        
    } catch (error) {
        console.error('[Weryfikacja] Błąd nadawania roli:', error);
        return interaction.reply({ content: '❌ Wystąpił błąd podczas nadawania roli!', ephemeral: true });
    }
}

// ===========================
// INIT
// ===========================
(async () => {

    await loadCommands();

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
