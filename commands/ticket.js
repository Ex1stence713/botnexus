import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, Colors } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Wczytaj config
function loadConfig() {
    try {
        const configPath = path.join(__dirname, '..', 'config.json');
        const data = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('❌ Błąd ładowania config.json:', err);
        return {};
    }
}

const config = loadConfig();

const TICKET_CATEGORY_ID = '1487725516810354718';
const SUPPORT_ROLE_ID = '1499838769254367391';
const TICKET_CHANNEL_PREFIX = 'ticket-';

// ID kanału ticketów z configu (można zmienić komendą)
let TICKET_CHANNEL_ID = "1499838770365599938" || null;
// ID kanału logów ticketów z configu
let TICKET_LOG_CHANNEL_ID = "1499838771548651689" || null;

const ticketCategories = {
    'support': { name: '📞 Support', color: 0x3498DB, description: 'Ogólne problemy i pytania' },
    'bug': { name: '🐛 Zgłoszenie błędu', color: 0xE74C3C, description: 'Błędy i problemy techniczne' },
    'suggestion': { name: '💡 Sugestia', color: 0x9B59B6, description: 'Propozycje i pomysły' },
    'report': { name: '⚠️ Zgłoszenie', color: 0xE67E22, description: 'Zgłoszenie użytkownika lub treści' },
    'partnership': { name: '🤝 Partnerstwo', color: 0xF1C40F, description: 'Pytania o współpracę' }
};

const userTickets = new Map();

export const name = 'ticket';
export const description = 'System ticketów - tworzenie i zarządzanie';

export async function execute(message, args) {
    if (args.length === 0) {
        return showTicketPanel(message);
    }

    if (args[0] === 'panel') {
        return showTicketPanel(message);
    }

    if (args[0] === 'send' && args[1]) {
        return sendTicketPanel(message, args[1]);
    }

    if (args[0] === 'close' && args[1]) {
        return closeTicket(message, args[1]);
    }

    if (args[0] === 'list') {
        return listTickets(message);
    }

    if (args[0] === 'uptime' || args[0] === 'stats') {
        return showBotStats(message);
    }

    if (args[0] === 'channel' && args[1]) {
        return setTicketChannel(message, args[1]);
    }

    if (args[0] === 'logchannel' && args[1]) {
        return setLogChannel(message, args[1]);
    }

    if (args[0] === 'config') {
        return showConfig(message);
    }

    return message.reply('Dostępne komendy ticket:\n- !ticket - panel wyboru\n- !ticket send <#kanał> - wyślij panel na kanał\n- !ticket list - lista twoich ticketów\n- !ticket close <id> - zamknij ticket\n- !ticket uptime - statystyki bota\n- !ticket channel <#kanał> - ustaw kanał ticketów\n- !ticket logchannel <#kanał> - ustaw kanał logów ticketów\n- !ticket config - pokaż aktualną konfigurację');
}

async function showTicketPanel(message) {
    const embed = new EmbedBuilder()
        .setTitle('🎫 System Ticketów')
        .setColor(0x5865F2)
        .setDescription('Wybierz kategorię ticketu, a my utworzymy dedykowany kanał dla Ciebie.')
        .addFields(
            { name: '📞 Support', value: 'Ogólne problemy i pytania', inline: true },
            { name: '🐛 Zgłoszenie błędu', value: 'Błędy i problemy techniczne', inline: true },
            { name: '💡 Sugestia', value: 'Propozycje i pomysły', inline: true },
            { name: '⚠️ Zgłoszenie', value: 'Zgłoszenie użytkownika lub treści', inline: true },
            { name: '🤝 Partnerstwo', value: 'Pytania o współpracę', inline: true }
        )
        .setFooter({ text: 'BotNexus • Kliknij przycisk poniżej' })
        .setTimestamp();

    const row = new ActionRowBuilder();
    
    Object.keys(ticketCategories).forEach(key => {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`ticket_${key}`)
                .setLabel(ticketCategories[key].name)
                .setStyle(ButtonStyle.Primary)
        );
    });

    await message.reply({ embeds: [embed], components: [row] });
}

export async function handleTicketButton(interaction) {
    try {
        const category = interaction.customId.replace('ticket_', '');
        const categoryData = ticketCategories[category];

        if (!categoryData) {
            return interaction.reply({ 
                content: '❌ Nieprawidłowa kategoria ticketu!', 
                ephemeral: true 
            });
        }

        const guild = interaction.guild;
        const user = interaction.user;

        const existingTickets = userTickets.get(user.id) || [];
        const userTicketCount = existingTickets.length;

        if (userTicketCount >= 5) {
            return interaction.reply({ 
                content: 'Masz już 5 otwartych ticketów! Zamknij jeden przed utworzeniem nowego.',
                ephemeral: true 
            });
        }

        const ticketId = Date.now().toString(36).toUpperCase();

        // Pobierz kategorie
        let categoryChannel = null;
        if (TICKET_CATEGORY_ID) {
            try {
                categoryChannel = await guild.channels.fetch(TICKET_CATEGORY_ID);
            } catch (err) {
                console.error('❌ Błąd pobierania kategorii ticketów:', err);
                categoryChannel = null;
            }
        }

        // Utwórz kanał ticketu
        const ticketChannel = await guild.channels.create({
            name: `ticket-${ticketId}`,
            type: ChannelType.GuildText,
            parent: categoryChannel,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
                },
                {
                    id: SUPPORT_ROLE_ID,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels]
                }
            ]
        });

        const ticketInfo = {
            id: ticketId,
            channelId: ticketChannel.id,
            userId: user.id,
            category: category,
            createdAt: Date.now()
        };

        if (!userTickets.has(user.id)) {
            userTickets.set(user.id, []);
        }
        userTickets.get(user.id).push(ticketInfo);

        const ticketEmbed = new EmbedBuilder()
            .setTitle(`${categoryData.name} #${ticketId}`)
            .setColor(categoryData.color)
            .setDescription(`**Ticket utworzony przez:** ${user}\n**Kategoria:** ${categoryData.description}`)
            .addFields(
                { name: '🆔 ID Ticketu', value: ticketId, inline: true },
                { name: '👤 Użytkownik', value: user.tag, inline: true },
                { name: '📅 Utworzony', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: 'BotNexus' })
            .setTimestamp();

        const closeRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`ticket_close_${ticketId}`)
                    .setLabel('🔒 Zamknij ticket')
                    .setStyle(ButtonStyle.Danger)
            );

        const welcomeMessage = await ticketChannel.send({
            content: `${user} Witaj w swoim tickecie! Opisz swój problem, a support odpowie jak najszybciej.`,
            embeds: [ticketEmbed],
            components: [closeRow]
        });

        await ticketChannel.send({ content: '📝 **Opisz swoją sprawę:**', components: [] });

        await interaction.reply({ 
            content: `✅ Ticket utworzony! <#${ticketChannel.id}>`,
            ephemeral: true 
        });

        const logEmbed = new EmbedBuilder()
            .setTitle('🎫 Nowy Ticket')
            .setColor(0x57F287)
            .addFields(
                { name: '👤 Użytkownik', value: user.tag, inline: true },
                { name: '📂 Kategoria', value: categoryData.name, inline: true },
                { name: '🔗 Kanał', value: `<#${ticketChannel.id}>`, inline: true }
            )
            .setFooter({ text: `ID: ${ticketId}` })
            .setTimestamp();

        if (TICKET_LOG_CHANNEL_ID) {
            const logChannel = guild.channels.cache.get(TICKET_LOG_CHANNEL_ID);
            if (logChannel) {
                logChannel.send({ embeds: [logEmbed] }).catch(err => {
                    console.error('❌ Błąd wysyłania logów ticketów:', err);
                });
            }
        }

    } catch (error) {
        console.error('❌ Błąd tworzenia ticketu:', error);
        
        const errorMessage = error.message || 'Nieznany błąd';
        
        try {
            await interaction.reply({ 
                content: `❌ Wystąpił błąd podczas tworzenia ticketu!\n\`\`\`${errorMessage}\`\`\``,
                ephemeral: true 
            });
        } catch (e) {
            console.error('❌ Nie można wysłać wiadomości błędu:', e);
        }
    }
}

    const ticketId = Date.now().toString(36).toUpperCase();

    let categoryChannel;
    try {
        categoryChannel = await guild.channels.fetch(TICKET_CATEGORY_ID);
    } catch {
        categoryChannel = null;
    }

    const ticketChannel = await guild.channels.create({
        name: `ticket-${ticketId}`,
        type: ChannelType.GuildText,
        parent: categoryChannel,
        permissionOverwrites: [
            {
                id: guild.roles.everyone,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: user.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
            },
            {
                id: SUPPORT_ROLE_ID,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels]
            }
        ]
    });

    const ticketInfo = {
        id: ticketId,
        channelId: ticketChannel.id,
        userId: user.id,
        category: category,
        createdAt: Date.now()
    };

    if (!userTickets.has(user.id)) {
        userTickets.set(user.id, []);
    }
    userTickets.get(user.id).push(ticketInfo);

    const ticketEmbed = new EmbedBuilder()
        .setTitle(`${categoryData.name} #${ticketId}`)
        .setColor(categoryData.color)
        .setDescription(`**Ticket utworzony przez:** ${user}\n**Kategoria:** ${categoryData.description}`)
        .addFields(
            { name: '🆔 ID Ticketu', value: ticketId, inline: true },
            { name: '👤 Użytkownik', value: user.tag, inline: true },
            { name: '📅 Utworzony', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
        )
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();

    const closeRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`ticket_close_${ticketId}`)
                .setLabel('🔒 Zamknij ticket')
                .setStyle(ButtonStyle.Danger)
        );

    const welcomeMessage = await ticketChannel.send({
        content: `${user} Witaj w swoim tickecie! Opisz swój problem, a support odpowie jak najszybciej.`,
        embeds: [ticketEmbed],
        components: [closeRow]
    });

    await ticketChannel.send({ content: '📝 **Opisz swoją sprawę:**', components: [] });

    await interaction.reply({ 
        content: `✅ Ticket utworzony! <#${ticketChannel.id}>`,
        ephemeral: true 
    });

    const logEmbed = new EmbedBuilder()
        .setTitle('🎫 Nowy Ticket')
        .setColor(0x57F287)
        .addFields(
            { name: '👤 Użytkownik', value: user.tag, inline: true },
            { name: '📂 Kategoria', value: categoryData.name, inline: true },
            { name: '🔗 Kanał', value: `<#${ticketChannel.id}>`, inline: true }
        )
        .setFooter({ text: `ID: ${ticketId}` })
        .setTimestamp();

    if (TICKET_LOG_CHANNEL_ID) {
        const logChannel = guild.channels.cache.get(TICKET_LOG_CHANNEL_ID);
        if (logChannel) {
            logChannel.send({ embeds: [logEmbed] }).catch(() => {});
        }
    }
}

export async function handleTicketCloseButton(interaction) {
    const ticketId = interaction.customId.replace('ticket_close_', '');
    
    const channel = interaction.channel;
    const user = interaction.user;

    for (const [userId, tickets] of userTickets) {
        const ticket = tickets.find(t => t.id === ticketId && t.channelId === channel.id);
        if (ticket) {
            await closeTicketById(interaction, ticket, userId);
            return;
        }
    }

    await interaction.reply({ content: 'Ten ticket nie został znaleziony!', ephemeral: true });
}

async function closeTicket(message, ticketId) {
    if (!message.guild) return;

    for (const [userId, tickets] of userTickets) {
        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket) {
            const channel = await message.guild.channels.fetch(ticket.channelId);
            if (channel) {
                await channel.delete();
            }
            tickets.splice(tickets.indexOf(ticket), 1);
            return message.reply(`Ticket #${ticketId} został zamknięty.`);
        }
    }

    return message.reply('Ticket nie znaleziony!');
}

async function closeTicketById(interaction, ticket, ownerId) {
    const channel = interaction.channel;
    const owner = await interaction.guild.members.fetch(ownerId);

    const closeEmbed = new EmbedBuilder()
        .setTitle('🔒 Ticket zamknięty')
        .setColor(0xED4245)
        .setDescription(`Ticket został zamknięty przez ${interaction.user}`)
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();

    await channel.send({ embeds: [closeEmbed] });

    setTimeout(async () => {
        try {
            await channel.delete();
        } catch {}
    }, 5000);

    const userTicketList = userTickets.get(ownerId);
    if (userTicketList) {
        const idx = userTicketList.findIndex(t => t.id === ticket.id);
        if (idx !== -1) userTicketList.splice(idx, 1);
    }

    await interaction.reply({ content: 'Ticket został zamknięty!', ephemeral: true });
}

async function showBotStats(message) {
    const client = message.client;
    const uptimeMs = client.uptime;
    const days = Math.floor(uptimeMs / 86400000);
    const hours = Math.floor((uptimeMs % 86400000) / 3600000);
    const mins = Math.floor((uptimeMs % 3600000) / 60000);
    const ping = client.ws.ping;

    // Kolor zależny od pingu
    let statusColor = 0x2ecc71; // zielony
    let statusEmoji = '🟢';
    let statusText = 'Online';
    if (ping >= 200) {
        statusColor = 0xe74c3c;
        statusEmoji = '🔴';
        statusText = '⚠️ Lag';
    } else if (ping >= 150) {
        statusColor = 0xf39c12;
        statusEmoji = '🟠';
        statusText = '🟡 Online';
    } else if (ping >= 100) {
        statusColor = 0xf1c40f;
        statusEmoji = '🟡';
        statusText = 'Online';
    }

    // Format uptime
    const uptimeStr = days > 0
        ? `${days}d ${hours}h ${mins}m`
        : `${hours}h ${mins}m`;

    // Statystyki
    const guilds = client.guilds.cache.size;
    const users = client.users.cache.size;
    const channels = client.channels.cache.size;

    // Największy serwer
    let biggestGuild = 'Brak';
    let biggestGuildMembers = 0;
    client.guilds.cache.forEach(g => {
        if (g.memberCount > biggestGuildMembers) {
            biggestGuildMembers = g.memberCount;
            biggestGuild = g.name;
        }
    });

    const embed = new EmbedBuilder()
        .setTitle(`${statusEmoji} Status Bota - Nexus`)
        .setColor(statusColor)
        .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
        .setDescription(`**${statusText}** | Wersja: 1.0.0`)
        .addFields(
            { name: `${statusEmoji} Status`, value: `\`${statusText}\``, inline: true },
            { name: '📡 Ping', value: `\`${ping}ms\``, inline: true },
            { name: '⏱️ Uptime', value: `\`${uptimeStr}\``, inline: true },
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

    await message.reply({ embeds: [embed] });
}

async function setTicketChannel(message, channelArg) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return message.reply('❌ Nie masz uprawnień do tej komendy! Wymagane: `Zarządzanie kanałami`');
    }

    if (!channelArg) {
        return message.reply('Podaj kanał! `!ticket channel <#kanał>`');
    }

    const channelId = channelArg.replace(/<#/, '').replace(/>/g, '');
    const channel = message.guild.channels.cache.get(channelId);

    if (!channel || channel.type !== ChannelType.GuildText) {
        return message.reply('Podaj poprawny kanał tekstowy! `!ticket channel <#kanał>`');
    }

    TICKET_CHANNEL_ID = channelId;
    config.ticketChannelId = channelId;
    saveConfig();

    await message.reply(`✅ Ustawiono kanał ticketów na: ${channel}`);
}

async function setLogChannel(message, channelArg) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return message.reply('❌ Nie masz uprawnień do tej komendy! Wymagane: `Zarządzanie kanałami`');
    }

    if (!channelArg) {
        return message.reply('Podaj kanał! `!ticket logchannel <#kanał>`');
    }

    const channelId = channelArg.replace(/<#/, '').replace(/>/g, '');
    const channel = message.guild.channels.cache.get(channelId);

    if (!channel || channel.type !== ChannelType.GuildText) {
        return message.reply('Podaj poprawny kanał tekstowy! `!ticket logchannel <#kanał>`');
    }

    TICKET_LOG_CHANNEL_ID = channelId;
    config.ticketLogChannelId = channelId;
    saveConfig();

    await message.reply(`✅ Ustawiono kanał logów ticketów na: ${channel}`);
}

function showConfig(message) {
    const embed = new EmbedBuilder()
        .setTitle('🎫 Konfiguracja Ticketów')
        .setColor(0x5865F2)
        .addFields(
            { name: '📺 Kanał ticketów', value: TICKET_CHANNEL_ID ? `<#${TICKET_CHANNEL_ID}>` : 'Nie ustawiony', inline: true },
            { name: '📋 Kanał logów', value: TICKET_LOG_CHANNEL_ID ? `<#${TICKET_LOG_CHANNEL_ID}>` : 'Nie ustawiony', inline: true },
            { name: '📁 Kategoria ticketów', value: `<#${TICKET_CATEGORY_ID}>`, inline: true },
            { name: '👥 Rola supportu', value: `<@&${SUPPORT_ROLE_ID}>`, inline: true }
        )
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();

    message.reply({ embeds: [embed] });
}

function saveConfig() {
    try {
        const configPath = path.join(__dirname, '..', 'config.json');
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (err) {
        console.error('❌ Błąd zapisywania config.json:', err);
    }
}

async function sendTicketPanel(message, channelArg) {
    // Sprawdź uprawnienia - tylko staff może wysłać panel na inny kanał
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return message.reply('❌ Nie masz uprawnień do tej komendy! Wymagane: `Zarządzanie kanałami`');
    }

    if (!channelArg) {
        return message.reply('Podaj kanał! `!ticket send <#kanał>`');
    }

    // Wyodrębnij ID kanału z mention lub bezpośredniego ID
    const channelId = channelArg.replace(/<#/, '').replace(/>/g, '');
    const channel = message.guild.channels.cache.get(channelId);

    if (!channel || channel.type !== ChannelType.GuildText) {
        return message.reply('Podaj poprawny kanał tekstowy! `!ticket send <#kanał>`');
    }

    await showTicketPanelToChannel(channel);
    await message.reply(`✅ Panel ticketów został wysłany na kanał ${channel}`);
}

async function showTicketPanelToChannel(targetChannel) {
    const embed = new EmbedBuilder()
        .setTitle('🎫 System Ticketów')
        .setColor(0x5865F2)
        .setDescription('Wybierz kategorię ticketu, a my utworzymy dedykowany kanał dla Ciebie.')
        .addFields(
            { name: '📞 Support', value: 'Ogólne problemy i pytania', inline: true },
            { name: '🐛 Zgłoszenie błędu', value: 'Błędy i problemy techniczne', inline: true },
            { name: '💡 Sugestia', value: 'Propozycje i pomysły', inline: true },
            { name: '⚠️ Zgłoszenie', value: 'Zgłoszenie użytkownika lub treści', inline: true },
            { name: '🤝 Partnerstwo', value: 'Pytania o współpracę', inline: true }
        )
        .setFooter({ text: 'BotNexus • Kliknij przycisk poniżej' })
        .setTimestamp();

    const row = new ActionRowBuilder();

    Object.keys(ticketCategories).forEach(key => {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`ticket_${key}`)
                .setLabel(ticketCategories[key].name)
                .setStyle(ButtonStyle.Primary)
        );
    });

    await targetChannel.send({ embeds: [embed], components: [row] });
}

async function listTickets(message) {
    if (!message.guild) return;

    const userId = message.author.id;
    const tickets = userTickets.get(userId);

    if (!tickets || tickets.length === 0) {
        return message.reply('Nie masz żadnych otwartych ticketów.');
    }

    let description = '';
    for (const ticket of tickets) {
        const categoryData = ticketCategories[ticket.category];
        const channel = await message.guild.channels.fetch(ticket.channelId).catch(() => null);
        description += `**#${ticket.id}** - ${categoryData.name} ${channel ? `- <#${ticket.channelId}>` : '(kanał usunięty)'}\n`;
    }

    const embed = new EmbedBuilder()
        .setTitle('📋 Twoje tickety')
        .setColor(0x5865F2)
        .setDescription(description)
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
}