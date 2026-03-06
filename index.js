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
const LOG_CHANNEL_ID = '1479629372158902373'; // Zmień na prawdziwe ID

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildModeration // Dla logów banów/kicków
    ]
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
client.commands = new Collection();

// --- 1. LOADER KOMEND ---
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') || file.endsWith('.cjs'));
const commandsJSON = [];

for (const file of commandFiles) {
    const filePath = pathToFileURL(path.join(commandsPath, file)).href;
    try {
        const commandModule = await import(filePath);
        const command = commandModule.default || commandModule;
        if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
            commandsJSON.push(command.data.toJSON());
        }
    } catch (e) { console.error(`Błąd komendy ${file}: ${e.message}`); }
}

// --- 2. REJESTRACJA SLASH COMMANDS ---
const rest = new REST({ version: '10' }).setToken(token);
(async () => {
    try {
        await rest.put(Routes.applicationCommands(clientId), { body: commandsJSON });
        console.log('✅ Komendy zarejestrowane.');
    } catch (e) { console.error(e); }
})();

// --- 3. FUNKCJA DO WYSYŁANIA LOGÓW ---
async function sendLog(embed) {
    const channel = client.channels.cache.get(LOG_CHANNEL_ID);
    if (channel) channel.send({ embeds: [embed] });
}

// --- 4. EVENTY LOGÓW (Wszystko z serwera) ---

// Log: Usunięcie wiadomości
client.on('messageDelete', (message) => {
    if (message.author?.bot) return;
    const embed = new EmbedBuilder()
        .setTitle('🗑️ Usunięto wiadomość')
        .setColor('Red')
        .addFields(
            { name: 'Autor', value: `${message.author?.tag || 'Nieznany'}`, inline: true },
            { name: 'Kanał', value: `${message.channel}`, inline: true },
            { name: 'Treść', value: message.content || '*Brak treści (obrazek lub embed)*' }
        )
        .setTimestamp();
    sendLog(embed);
});

// Log: Edycja wiadomości
client.on('messageUpdate', (oldMsg, newMsg) => {
    if (oldMsg.author?.bot || oldMsg.content === newMsg.content) return;
    const embed = new EmbedBuilder()
        .setTitle('✏️ Edytowano wiadomość')
        .setColor('Yellow')
        .addFields(
            { name: 'Autor', value: `${oldMsg.author.tag}`, inline: true },
            { name: 'Przed', value: oldMsg.content || '*Brak*' },
            { name: 'Po', value: newMsg.content || '*Brak*' }
        )
        .setTimestamp();
    sendLog(embed);
});

// Log: Nowy użytkownik
client.on('guildMemberAdd', (member) => {
    const embed = new EmbedBuilder()
        .setTitle('📥 Nowy członek')
        .setColor('Green')
        .setDescription(`${member.user.tag} dołączył do serwera.`)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();
    sendLog(embed);
});

// Log: Wyjście użytkownika
client.on('guildMemberRemove', (member) => {
    const embed = new EmbedBuilder()
        .setTitle('📤 Odejście/Kick')
        .setColor('Orange')
        .setDescription(`${member.user.tag} opuścił serwer.`)
        .setTimestamp();
    sendLog(embed);
});

// --- 5. OBSŁUGA TICKETÓW I KOMEND ---
client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command) await command.execute(interaction);
    }

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

            // Log ticketu
            sendLog(new EmbedBuilder().setTitle('🎫 Nowy Ticket').setColor('Blue').setDescription(`Otwarty przez: ${interaction.user.tag}`).setTimestamp());

            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 Zamknij').setStyle(ButtonStyle.Danger));
            await channel.send({ content: `Witaj ${interaction.user}`, components: [row] });
            await interaction.reply({ content: 'Ticket stworzony!', flags: [MessageFlags.Ephemeral] });
        }

        if (interaction.customId === 'close_ticket') {
            sendLog(new EmbedBuilder().setTitle('🔒 Zamknięto Ticket').setColor('Grey').setDescription(`Zamknięty przez: ${interaction.user.tag}`).setTimestamp());
            await interaction.reply('Zamykanie...');
            setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        }
    }
});

client.once('clientReady', (c) => {
    console.log(`✅ Zalogowano: ${c.user.tag}`);
    c.user.setPresence({ activities: [{ name: 'Logi serwera', type: ActivityType.Watching }], status: 'online' });
});

client.login(token);