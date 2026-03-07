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

// --- KONFIGURACJA ---
const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID;
const LOG_CHANNEL_ID = '1479629372158902373'; // <--- TUTAJ WPISZ ID KANAŁU

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

// --- 1. LOADER KOMEND (Automatyczne wykrywanie plików w /commands) ---
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
    } catch (error) {
        console.error(`❌ Błąd ładowania ${file}: ${error.message}`);
    }
}

// --- 2. REJESTRACJA KOMEND SLASH ---
const rest = new REST({ version: '10' }).setToken(token);
(async () => {
    try {
        await rest.put(Routes.applicationCommands(clientId), { body: commandsJSON });
        console.log('✅ Komendy Slash zarejestrowane pomyślnie.');
    } catch (error) {
        console.error('❌ Błąd REST:', error);
    }
})();

// --- 3. POMOCNICZA FUNKCJA LOGUJĄCA ---
async function sendLog(embed) {
    const channel = client.channels.cache.get(LOG_CHANNEL_ID);
    if (channel) channel.send({ embeds: [embed] }).catch(console.error);
}

// --- 4. EVENTY LOGÓW (Śledzenie zmian na serwerze) ---

// Log: Usunięcie wiadomości
client.on('messageDelete', (message) => {
    if (message.author?.bot) return;
    const embed = new EmbedBuilder()
        .setTitle('🗑️ Usunięto wiadomość')
        .setColor('#ff4747')
        .addFields(
            { name: 'Autor', value: `${message.author?.tag || 'Nieznany'}`, inline: true },
            { name: 'Kanał', value: `${message.channel}`, inline: true },
            { name: 'Treść', value: message.content || '*Brak treści (plik/embed)*' }
        )
        .setTimestamp();
    sendLog(embed);
});

// Log: Edycja wiadomości
client.on('messageUpdate', (oldMsg, newMsg) => {
    if (oldMsg.author?.bot || oldMsg.content === newMsg.content) return;
    const embed = new EmbedBuilder()
        .setTitle('✏️ Edytowano wiadomość')
        .setColor('#ffcc00')
        .addFields(
            { name: 'Autor', value: `${oldMsg.author?.tag}`, inline: true },
            { name: 'Przed', value: oldMsg.content || '*Brak*' },
            { name: 'Po', value: newMsg.content || '*Brak*' }
        )
        .setTimestamp();
    sendLog(embed);
});

// Log: Nowy użytkownik
client.on('guildMemberAdd', (member) => {
    sendLog(new EmbedBuilder()
        .setTitle('📥 Nowy członek')
        .setColor('#2ecc71')
        .setDescription(`Użytkownik **${member.user.tag}** dołączył do serwera.`)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp());
});

// --- 5. OBSŁUGA STARTU (Status i Raport Zmian) ---
client.once('clientReady', (c) => {
    console.log(`🚀 Bot Nexus online jako ${c.user.tag}`);
    
    c.user.setPresence({
        activities: [{ name: '/pomoc | Logi', type: ActivityType.Watching }],
        status: 'online',
    });

    // Raport po restarcie (widzisz co dodałeś w kodzie)
    const startupEmbed = new EmbedBuilder()
        .setTitle('⚙️ System Uruchomiony')
        .setColor('#5865F2')
        .setDescription('Wykryto restart bota. Załadowane zasoby:')
        .addFields(
            { name: '📂 Komendy:', value: loadedCommandsNames.join(', ') || 'Brak komend' },
            { name: '📡 Status:', value: '🟢 Online i gotowy', inline: true },
            { name: '🖥️ Serwery:', value: `${client.guilds.cache.size}`, inline: true }
        )
        .setTimestamp();
    sendLog(startupEmbed);
});

// --- 6. OBSŁUGA INTERAKCJI (Komendy i Tickety) ---
client.on('interactionCreate', async (interaction) => {
    // Komendy Slash
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
            // Opcjonalny log użycia komendy
            console.log(`[CMD] ${interaction.user.tag} użył /${interaction.commandName}`);
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: 'Wystąpił błąd podczas wykonywania tej komendy!', 
                flags: [MessageFlags.Ephemeral] 
            });
        }
    }

    // System Ticketów (Przyciski)
    if (interaction.isButton()) {
        if (interaction.customId === 'create_ticket') {
            const channel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                ]
            });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 Zamknij').setStyle(ButtonStyle.Danger)
            );

            await channel.send({ content: `Witaj ${interaction.user}, opisz swój problem.`, components: [row] });
            await interaction.reply({ content: `Ticket utworzony: ${channel}`, flags: [MessageFlags.Ephemeral] });
            
            sendLog(new EmbedBuilder().setTitle('🎫 Nowy Ticket').setColor('#3498db').setDescription(`Użytkownik **${interaction.user.tag}** otworzył zgłoszenie.`).setTimestamp());
        }

        if (interaction.customId === 'close_ticket') {
            sendLog(new EmbedBuilder().setTitle('🔒 Zamknięto Ticket').setColor('#95a5a6').setDescription(`Zgłoszenie na kanale **${interaction.channel.name}** zostało zamknięte przez **${interaction.user.tag}**.`).setTimestamp());
            await interaction.reply('Kanał zostanie usunięty za 3 sekundy...');
            setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        }
    }
});

client.login(token);