import { 
    Client, 
    Collection, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionsBitField,
    ChannelType,
    MessageFlags,
    ActivityType,
    EmbedBuilder 
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// ==========================================
//              KONFIGURACJA ID
// ==========================================
// Wpisz ID kanałów bezpośrednio tutaj:
const LOG_CHANNEL_ID = 'TU_WLEJ_ID_LOGOW';        
const STATUS_CHANNEL_ID = 'TU_WLEJ_ID_STATUSU';  
// ==========================================

const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID; // Upewnij się, że w .env masz CLIENT_ID=...

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
client.commands = new Collection();

// --- 1. LOADER KOMEND ---
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') || file.endsWith('.cjs'));
const commandsJSON = [];
const loadedCommandsNames = [];

for (const file of commandFiles) {
    const filePath = pathToFileURL(path.join(commandsPath, file)).href;
    try {
        const commandModule = await import(filePath);
        const command = commandModule.default || commandModule;
        if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
            commandsJSON.push(command.data.toJSON());
            loadedCommandsNames.push(`\`/${command.data.name}\``);
        }
    } catch (e) { console.error(`❌ Błąd ładowania ${file}: ${e.message}`); }
}

// --- 2. REJESTRACJA KOMEND SLASH (Poprawione undefined) ---
const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        if (!clientId) {
            console.error('❌ BŁĄD: CLIENT_ID jest undefined! Sprawdź plik .env.');
            return;
        }

        console.log('🔄 Rejestrowanie komend (/) dla aplikacji...');
        await rest.put(
            Routes.applicationCommands(clientId), // To ID musi być poprawne
            { body: commandsJSON },
        );
        console.log('✅ Komendy zarejestrowane pomyślnie.');
    } catch (error) {
        console.error('❌ Błąd rejestracji:', error);
    }
})();

// --- 3. FUNKCJA PUBLICZNEGO STATUSU (Live Stats) ---
async function updatePublicStatus() {
    try {
        const channel = await client.channels.fetch(STATUS_CHANNEL_ID).catch(() => null);
        if (!channel) return;

        const uptime = Math.floor(client.uptime / 60000);
        const hours = Math.floor(uptime / 60);
        const mins = uptime % 60;

        const statusEmbed = new EmbedBuilder()
            .setTitle('📊 Monitor Systemowy Nexus')
            .setColor(client.ws.ping < 100 ? '#2ecc71' : '#f1c40f')
            .addFields(
                { name: '🟢 Status', value: 'Działa poprawnie', inline: true },
                { name: '⚡ Ping', value: `\`${client.ws.ping}ms\``, inline: true },
                { name: '⏳ Uptime', value: `\`${hours}h ${mins}m\``, inline: true },
                { name: '🕒 Aktualizacja', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: false }
            )
            .setFooter({ text: 'Odświeżane co 60s' })
            .setTimestamp();

        const messages = await channel.messages.fetch({ limit: 10 });
        const lastBotMsg = messages.find(m => m.author.id === client.user.id);

        if (lastBotMsg) await lastBotMsg.edit({ embeds: [statusEmbed] });
        else await channel.send({ embeds: [statusEmbed] });
    } catch (e) { console.error('Błąd statusu:', e); }
}

// --- 4. FUNKCJA LOGUJĄCA ---
async function sendLog(embed) {
    const channel = client.channels.cache.get(LOG_CHANNEL_ID);
    if (channel) channel.send({ embeds: [embed] }).catch(() => {});
}

// --- 5. LOGI ZDARZEŃ ---
client.on('messageDelete', (m) => {
    if (m.author?.bot) return;
    sendLog(new EmbedBuilder().setTitle('🗑️ Wiadomość usunięta').setColor('Red')
    .addFields({name:'Autor', value:`${m.author?.tag}`, inline:true}, {name:'Kanał', value:`${m.channel}`, inline:true}, {name:'Treść', value:m.content || 'Plik/Embed'})
    .setTimestamp());
});

client.on('guildMemberAdd', (member) => {
    sendLog(new EmbedBuilder().setTitle('📥 Nowy gracz').setColor('Green').setDescription(`${member.user.tag} dołączył.`).setTimestamp());
});

// --- 6. START BOTA ---
client.once('clientReady', (c) => {
    console.log(`🚀 Zalogowano jako ${c.user.tag}`);
    c.user.setPresence({ activities: [{ name: '/pomoc', type: ActivityType.Listening }], status: 'online' });

    // Raport startowy dla logów
    sendLog(new EmbedBuilder().setTitle('🤖 Restart Systemu').setColor('Blue')
    .addFields({ name: '📂 Komendy:', value: loadedCommandsNames.join(', ') || 'Brak' }).setTimestamp());

    // Uruchomienie auto-odświeżania statusu co 1 min
    updatePublicStatus();
    setInterval(updatePublicStatus, 60000); 
});

// --- 7. OBSŁUGA INTERAKCJI ---
client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command) await command.execute(interaction).catch(() => {});
    }
});

client.login(token);