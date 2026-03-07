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
const LOG_CHANNEL_ID = '1479629372158902373'; // Kanał dla administracji
const STATUS_CHANNEL_ID = '1479630853054267412'; // Kanał publiczny dla graczy
// ==========================================

const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID;

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
    } catch (e) { console.error(`❌ Błąd komendy ${file}: ${e.message}`); }
}

// --- 2. REJESTRACJA KOMEND SLASH ---
const rest = new REST({ version: '10' }).setToken(token);
(async () => {
    try {
        await rest.put(Routes.applicationCommands(clientId), { body: commandsJSON });
        console.log('✅ Komendy zarejestrowane.');
    } catch (e) { console.error(e); }
})();

// --- 3. FUNKCJA PUBLICZNEGO STATUSU (AUTOMATYCZNE ODŚWIEŻANIE) ---
async function updatePublicStatus() {
    try {
        const channel = await client.channels.fetch(STATUS_CHANNEL_ID).catch(() => null);
        if (!channel) return console.log('⚠️ Nie znaleziono kanału statusu.');

        const uptime = Math.floor(client.uptime / 60000);
        const hours = Math.floor(uptime / 60);
        const mins = uptime % 60;

        const statusEmbed = new EmbedBuilder()
            .setTitle('📊 Monitor Systemowy Nexus')
            .setColor(client.ws.ping < 100 ? '#2ecc71' : '#f1c40f')
            .addFields(
                { name: '🟢 Status bota', value: 'Działa poprawnie', inline: true },
                { name: '⚡ Opóźnienie', value: `\`${client.ws.ping}ms\``, inline: true },
                { name: '⏳ Uptime', value: `\`${hours}h ${mins}m\``, inline: true },
                { name: '👥 Serwer', value: `\`${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)} osób\``, inline: true },
                { name: '🕒 Ostatnie odświeżenie', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: false }
            )
            .setFooter({ text: 'Status odświeża się automatycznie co 60 sekund' })
            .setTimestamp();

        const messages = await channel.messages.fetch({ limit: 10 });
        const lastBotMsg = messages.find(m => m.author.id === client.user.id);

        if (lastBotMsg) {
            await lastBotMsg.edit({ embeds: [statusEmbed] });
            console.log('🔄 Status zaktualizowany.');
        } else {
            await channel.send({ embeds: [statusEmbed] });
            console.log('📨 Wysłano nową wiadomość statusu.');
        }
    } catch (e) {
        console.error('❌ Błąd podczas odświeżania statusu:', e);
    }
}

// --- 4. FUNKCJA LOGUJĄCA DLA ADMINA ---
async function sendLog(embed) {
    const channel = client.channels.cache.get(LOG_CHANNEL_ID);
    if (channel) channel.send({ embeds: [embed] }).catch(() => {});
}

// --- 5. LOGI ZDARZEŃ (USUNIĘCIA/EDYCJE) ---
client.on('messageDelete', (m) => {
    if (m.author?.bot) return;
    sendLog(new EmbedBuilder().setTitle('🗑️ Wiadomość usunięta').setColor('Red')
    .addFields({name:'Autor', value:`${m.author?.tag}`, inline:true}, {name:'Kanał', value:`${m.channel}`, inline:true}, {name:'Treść', value:m.content || 'Plik/Embed'})
    .setTimestamp());
});

client.on('guildMemberAdd', (member) => {
    sendLog(new EmbedBuilder().setTitle('📥 Nowy gracz').setColor('Green').setDescription(`${member.user.tag} wszedł na serwer.`).setTimestamp());
});

// --- 6. START BOTA I INTERWAŁY ---
client.once('clientReady', (c) => {
    console.log(`🚀 Zalogowano jako ${c.user.tag}`);
    c.user.setPresence({ activities: [{ name: '/pomoc', type: ActivityType.Listening }], status: 'online' });

    // Raport startowy
    sendLog(new EmbedBuilder().setTitle('🤖 System Restart').setColor('Blue')
    .addFields({ name: '📂 Załadowano komendy:', value: loadedCommandsNames.join(', ') || 'Brak' }).setTimestamp());

    // --- KLUCZOWE: ODŚWIEŻANIE CO 1 MINUTĘ ---
    updatePublicStatus(); // Odśwież od razu po starcie
    setInterval(() => {
        updatePublicStatus();
    }, 60000); // 60000 ms = 1 minuta
});

// --- 7. OBSŁUGA INTERAKCJI ---
client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command) await command.execute(interaction).catch(() => {});
    }

    if (interaction.isButton()) {
        if (interaction.customId === 'create_ticket') {
            const ch = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                ]
            });
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 Zamknij').setStyle(ButtonStyle.Danger));
            await ch.send({ content: `Witaj ${interaction.user}, opisz swój problem.`, components: [row] });
            await interaction.reply({ content: `Otwarto: ${ch}`, flags: [MessageFlags.Ephemeral] });
            sendLog(new EmbedBuilder().setTitle('🎫 Ticket').setDescription(`${interaction.user.tag} otworzył zgłoszenie.`).setColor('Blue').setTimestamp());
        }

        if (interaction.customId === 'close_ticket') {
            sendLog(new EmbedBuilder().setTitle('🔒 Zamknięto').setDescription(`Ticket zamknięty przez ${interaction.user.tag}`).setColor('Grey').setTimestamp());
            await interaction.reply('Zamykanie...');
            setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        }
    }
    // Wewnątrz client.on('interactionCreate', async (interaction) => { ... })

if (interaction.isButton()) {
    // Sprawdzamy czy ID przycisku zaczyna się od 'help_'
    if (interaction.customId.startsWith('help_')) {
        
        const categoryEmbed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ 
                text: `${interaction.client.user.username} • System pomocy`, 
                iconURL: interaction.client.user.displayAvatarURL() 
            });

        // Logika wyświetlania konkretnych kategorii
        switch (interaction.customId) {
            case 'help_fun':
                categoryEmbed.setTitle('🎉 KOMENDY FUN')
                    .setDescription('• `/roll` — Rzut kostką\n• `/coinflip` — Rzut monetą\n• `/avatar` — Pokazuje avatar');
                break;

            case 'help_other':
                categoryEmbed.setTitle('📁 KOMENDY INNE')
                    .setDescription('• `/help` — Menu pomocy\n• `/status` — Status bota');
                break;

            case 'help_config':
                categoryEmbed.setTitle('⚙️ KONFIGURACJA')
                    .setDescription(
                        '• `!antylink` — Konfiguracja Anti-Link\n' +
                        '• `!autorole` — Zarządzanie rolami\n' +
                        '• `!ticket` — System ticketów\n' +
                        '• `!verify` — Panel weryfikacji'
                    );
                break;

            case 'help_mod':
                categoryEmbed.setTitle('🛡️ MODERACJA')
                    .setDescription('• `/clear` — Czyści wiadomości\n• `/kick` — Wyrzuca użytkownika\n• `/ban` — Banuje użytkownika');
                break;
        }

        // Edytujemy wiadomość zamiast wysyłać nową
        await interaction.update({ embeds: [categoryEmbed] });
    }
}
});

client.login(token);