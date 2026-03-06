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
    MessageFlags // Nowość w v14.14+
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID; // Dodaj to do .env!

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

client.commands = new Collection();

// --- 1. LOADER KOMEND ---
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') || file.endsWith('.cjs'));

const commandsJSON = [];

for (const file of commandFiles) {
    const filePath = pathToFileURL(path.join(commandsPath, file)).href;
    try {
        const command = await import(filePath);
        // Obsługa export default lub module.exports
        const cmdData = command.default || command;
        
        if ('data' in cmdData && 'execute' in cmdData) {
            client.commands.set(cmdData.data.name, cmdData);
            commandsJSON.push(cmdData.data.toJSON());
        }
    } catch (error) {
        console.error(`[BŁĄD] Nie udało się załadować komendy ${file}: ${error.message}`);
    }
}

// --- 2. REJESTRACJA KOMEND SLASH ---
const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Rozpoczynanie odświeżania komend (/) aplikacji.');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commandsJSON },
        );
        console.log('Pomyślnie zarejestrowano komendy.');
    } catch (error) {
        console.error(error);
    }
})();

// --- 3. OBSŁUGA INTERAKCJI ---
client.on('interactionCreate', async (interaction) => {
    // Obsługa Komend Slash
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: 'Wystąpił błąd podczas wykonywania tej komendy!', 
                flags: [MessageFlags.Ephemeral] 
            });
        }
    }

    // Obsługa Przycisków (Ticket)
    if (interaction.isButton()) {
        if (interaction.customId === 'create_ticket') {
            const channel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                    }
                ]
            });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('🔒 Zamknij Ticket')
                    .setStyle(ButtonStyle.Danger)
            );

            await channel.send({
                content: `👋 Witaj ${interaction.user}, opisz swój problem.`,
                components: [row]
            });

            await interaction.reply({ 
                content: `Ticket utworzony: ${channel}`, 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        if (interaction.customId === 'close_ticket') {
            await interaction.reply({ content: 'Zamykanie ticketu za 3 sekundy...' });
            setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        }
    }
});

// Zmieniono 'ready' na 'clientReady' zgodnie z logami
client.once('clientReady', (c) => {
    console.log(`✅ Zalogowano jako ${c.user.tag}`);
});

client.login(token);