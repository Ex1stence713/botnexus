import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, Colors, StringSelectBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../database.js';

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
    'support': { name: '📞 Support', color: 0x3498DB, description: 'Ogólne problemy i pytania', priority: 2 },
    'bug': { name: '🐛 Zgłoszenie błędu', color: 0xE74C3C, description: 'Błędy i problemy techniczne', priority: 1 },
    'suggestion': { name: '💡 Sugestia', color: 0x9B59B6, description: 'Propozycje i pomysły', priority: 3 },
    'report': { name: '⚠️ Zgłoszenie', color: 0xE67E22, description: 'Zgłoszenie użytkownika lub treści', priority: 1 },
    'partnership': { name: '🤝 Partnerstwo', color: 0xF1C40F, description: 'Pytania o współpracę', priority: 3 }
};

// Stałe statusów
const TICKET_STATUS = {
    OPEN: 'open',
    CLAIMED: 'claimed',
    WAITING_FOR_USER: 'waiting_for_user',
    CLOSED: 'closed'
};

// Stałe priorytetów
const TICKET_PRIORITY = {
    LOW: 3,
    MEDIUM: 2,
    HIGH: 1,
    CRITICAL: 0
};

// Database helper functions
function getUserTickets(userId, guildId) {
    const stmt = db.prepare('SELECT * FROM tickets WHERE user_id = ? AND guild_id = ? AND status != "closed" ORDER BY created_at DESC');
    return stmt.all(userId, guildId);
}

function getTicketById(ticketId) {
    const stmt = db.prepare('SELECT * FROM tickets WHERE id = ?');
    return stmt.get(ticketId);
}

function getTicketByChannel(channelId) {
    const stmt = db.prepare('SELECT * FROM tickets WHERE channel_id = ?');
    return stmt.get(channelId);
}

function createTicket(ticketData) {
    const stmt = db.prepare(`
        INSERT INTO tickets (id, channel_id, guild_id, user_id, category, priority, status, created_at, last_activity, auto_close_delay)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
        ticketData.id,
        ticketData.channelId,
        ticketData.guildId,
        ticketData.userId,
        ticketData.category,
        ticketData.priority || 2,
        'open',
        ticketData.createdAt,
        ticketData.createdAt,
        86400 // 24 hours default
    );
}

function updateTicketStatus(ticketId, status, closedBy = null, closeReason = null) {
    const now = Date.now();
    if (status === 'closed') {
        const stmt = db.prepare(`
            UPDATE tickets SET status = ?, closed_at = ?, closed_by = ?, close_reason = ? WHERE id = ?
        `);
        stmt.run(status, now, closedBy, closeReason, ticketId);
    } else {
        const stmt = db.prepare('UPDATE tickets SET status = ? WHERE id = ?');
        stmt.run(status, ticketId);
    }
}

function claimTicket(ticketId, claimedBy) {
    const now = Date.now();
    const stmt = db.prepare('UPDATE tickets SET status = "claimed", claimed_by = ?, claim_time = ? WHERE id = ?');
    stmt.run(claimedBy, now, ticketId);
}

function unclaimTicket(ticketId) {
    const stmt = db.prepare('UPDATE tickets SET status = "open", claimed_by = NULL, claim_time = NULL WHERE id = ?');
    stmt.run(ticketId);
}

function updateLastActivity(ticketId) {
    const now = Date.now();
    const stmt = db.prepare('UPDATE tickets SET last_activity = ? WHERE id = ?');
    stmt.run(now, ticketId);
}

function rateTicket(ticketId, rating, comment = null) {
    const stmt = db.prepare('UPDATE tickets SET rating = ?, rating_comment = ? WHERE id = ?');
    stmt.run(rating, comment, ticketId);
}

function setTicketPriority(ticketId, priority) {
    const stmt = db.prepare('UPDATE tickets SET priority = ? WHERE id = ?');
    stmt.run(priority, ticketId);
}

function getTicketNotes(ticketId) {
    const stmt = db.prepare('SELECT * FROM ticket_notes WHERE ticket_id = ? ORDER BY created_at DESC');
    return stmt.all(ticketId);
}

function addTicketNote(ticketId, authorId, content) {
    const noteId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const stmt = db.prepare('INSERT INTO ticket_notes (id, ticket_id, author_id, content, created_at) VALUES (?, ?, ?, ?, ?)');
    stmt.run(noteId, ticketId, authorId, content, Date.now());
    return noteId;
}

function setTicketPriority(ticketId, priority) {
    const stmt = db.prepare('UPDATE tickets SET priority = ? WHERE id = ?');
    stmt.run(priority, ticketId);
}

function getInactiveTickets() {
    const now = Date.now();
    const stmt = db.prepare(`
        SELECT * FROM tickets 
        WHERE status IN ('open', 'claimed', 'waiting_for_user') 
        AND last_activity < ?
        AND auto_close_delay > 0
    `);
    return stmt.all(now - 86400000); // 24h = 86400000ms
}

function getAllOpenTickets(guildId) {
    const stmt = db.prepare('SELECT * FROM tickets WHERE guild_id = ? AND status IN ("open", "claimed", "waiting_for_user") ORDER BY priority ASC, created_at ASC');
    return stmt.all(guildId);
}

function getStaffStats(staffId, guildId) {
    const stmt = db.prepare(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
            SUM(CASE WHEN status = 'claimed' AND claimed_by = ? THEN 1 ELSE 0 END) as currently_claimed,
            AVG(rating) as avg_rating
        FROM tickets 
        WHERE guild_id = ? AND (claimed_by = ? OR user_id = ?)
    `);
    return stmt.get(staffId, guildId, staffId, staffId);
}

function formatStatus(status) {
    switch(status) {
        case 'open': return '🟢 Otwarty';
        case 'claimed': return '🟡 Zajęty';
        case 'waiting_for_user': return '🟠 Oczekuje na użytkownika';
        case 'closed': return '🔴 Zamknięty';
        default: return '❓ Nieznany';
    }
}
}

function formatPriority(priority) {
    switch(priority) {
        case 0: return '🔴 Krytyczny';
        case 1: return '🟠 Wysoki';
        case 2: return '🟡 Średni';
        case 3: return '🟢 Niski';
        default: return '⚪ Nieustawiony';
    }
}

// Znajdź dostępnego członka staffu (online, z rolą supportu)
async function findAvailableSupportMember(guild) {
    try {
        const supportRole = await guild.roles.fetch(SUPPORT_ROLE_ID);
        if (!supportRole) return null;

        // Priorytet: claimed_none → online → idle → do_not_disturb
        const statusPriority = {
            'online': 0,
            'idle': 1,
            'dnd': 2,
            'offline': 3
        };

        const members = guild.members.cache
            .filter(m => m.roles.cache.has(supportRole.id) && !m.user.bot)
            .sort((a, b) => {
                const aPresence = a.presence?.status || 'offline';
                const bPresence = b.presence?.status || 'offline';
                return (statusPriority[aPresence] || 4) - (statusPriority[bPresence] || 4);
            });

        return members.first() || null;
    } catch (err) {
        console.error('❌ Błąd szukania supportu:', err);
        return null;
    }
}

// Auto-claim ticket
async function autoClaimTicket(ticketId, channel, staffMember) {
    try {
        updateTicketStatus(ticketId, 'claimed', staffMember.id);
        
        const embed = new EmbedBuilder()
            .setTitle('🎫 Ticket zajęty')
            .setColor(0xF1C40F)
            .setDescription(`Ticket został automatycznie przypisany do ${staffMember}`)
            .addFields(
                { name: '👤 Support', value: `<@${staffMember.id}>`, inline: true },
                { name: '📅 Czas', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: 'Auto-claim • BotNexus' })
            .setTimestamp();

        await channel.send({ embeds: [embed] });
        return true;
    } catch (err) {
        console.error('❌ Błąd auto-claim:', err);
        return false;
    }
}

// Generuj transkrypcję ticketu
async function generateTranscript(ticket, guild) {
    try {
        const channel = await guild.channels.fetch(ticket.channel_id);
        if (!channel) return null;

        const messages = [];
        const fetched = await channel.messages.fetch({ limit: 100 });
        
        fetched.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
        
        let transcript = `====================================\n`;
        transcript += `TRANSCRYPT TICKET #${ticket.id}\n`;
        transcript += `====================================\n\n`;
        transcript += `📂 Kategoria: ${ticketCategories[ticket.category]?.name || ticket.category}\n`;
        transcript += `👤 Użytkownik: <@${ticket.user_id}>\n`;
        transcript += `📅 Utworzony: <t:${Math.floor(ticket.created_at / 1000)}:R>\n`;
        transcript += `📊 Status: ${formatStatus(ticket.status)}\n`;
        transcript += `⚡ Priorytet: ${formatPriority(ticket.priority)}\n`;
        if (ticket.claimed_by) {
            transcript += `👷 Support: <@${ticket.claimed_by}>\n`;
        }
        transcript += `====================================\n\n`;

        for (const msg of fetched.values()) {
            const author = msg.author;
            const time = `<t:${Math.floor(msg.createdTimestamp / 1000)}:T>`;
            const content = msg.content || '(brak treści)';
            const attachments = msg.attachments.size > 0 
                ? ` | 📎 Załączniki: ${msg.attachments.map(a => a.name).join(', ')}` 
                : '';
            
            transcript += `[${time}] ${author.tag} (${author.id}): ${content}${attachments}\n\n`;
        }

        transcript += `====================================\n`;
        transcript += `Koniec transkrypcji - ${new Date().toLocaleString()}\n`;
        transcript += `====================================\n`;

        return Buffer.from(transcript, 'utf-8');
    } catch (err) {
        console.error('❌ Błąd generowania transkrypcji:', err);
        return null;
    }
}

// Poproś o ocenę
async function requestRating(interaction, ticket, owner) {
    try {
        await interaction.channel.send({
            content: `${owner}, proszę o ocenę obsługi! 🎯`,
            embeds: [new EmbedBuilder()
                .setTitle('⭐ Oceń obsługę')
                .setColor(0x5865F2)
                .setDescription('Jak oceniasz obsługę w tym tickecie?')
                .addFields(
                    { name: '1 - Bardzo źle', value: '🔴', inline: true },
                    { name: '2 - Źle', value: '🟠', inline: true },
                    { name: '3 - Przeciętnie', value: '🟡', inline: true },
                    { name: '4 - Dobrze', value: '🟢', inline: true },
                    { name: '5 - Bardzo dobrze', value: '💎', inline: true }
                )
                .setFooter({ text: 'Ocena会自动 zamknie ticket po 30s' })
                .setTimestamp()
            ],
            components: [new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`rating_${ticket.id}_1`)
                        .setLabel('1')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🔴'),
                    new ButtonBuilder()
                        .setCustomId(`rating_${ticket.id}_2`)
                        .setLabel('2')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🟠'),
                    new ButtonBuilder()
                        .setCustomId(`rating_${ticket.id}_3`)
                        .setLabel('3')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🟡'),
                    new ButtonBuilder()
                        .setCustomId(`rating_${ticket.id}_4`)
                        .setLabel('4')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('🟢'),
                    new ButtonBuilder()
                        .setCustomId(`rating_${ticket.id}_5`)
                        .setLabel('5')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('💎')
                )
            ]
        });
    } catch (err) {
        console.error('❌ Błąd prośby o rating:', err);
    }
}

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

    if (args[0] === 'note' && args[1] && args[2]) {
        return addNote(message, args[1], args.slice(2).join(' '));
    }

    if (args[0] === 'priority' && args[1] && args[2]) {
        return setPriorityCommand(message, args[1], args[2]);
    }

    if (args[0] === 'staff') {
        return showStaffStats(message);
    }

    if (args[0] === 'autoclose' && args[1]) {
        return runAutoClose(message, args[1]);
    }

    return message.reply('Dostępne komendy ticket:\n- !ticket - panel wyboru\n- !ticket send <#kanał> - wyślij panel na kanał\n- !ticket list - lista twoich ticketów\n- !ticket close <id> - zamknij ticket\n- !ticket note <id> <treść> - dodaj notatkę do ticketu\n- !ticket priority <id> <0-3> - zmień priorytet (0=Krytyczny, 3=Niski)\n- !ticket staff - statystyki personelu\n- !ticket autoclose <guild_id> - ręczne auto-close (admin)\n- !ticket uptime - statystyki bota\n- !ticket channel <#kanał> - ustaw kanał ticketów\n- !ticket logchannel <#kanał> - ustaw kanał logów ticketów\n- !ticket config - pokaż aktualną konfigurację');
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

        const existingTickets = getUserTickets(user.id, guild.id);
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
            guildId: guild.id,
            userId: user.id,
            category: category,
            priority: categoryData.priority || 2,
            createdAt: Date.now()
        };

        createTicket(ticketInfo);

        // Spróbuj auto-claim jeśli jest dostępny support
        const availableStaff = await findAvailableSupportMember(guild);
        if (availableStaff) {
            await autoClaimTicket(ticketId, ticketChannel, availableStaff);
        }

        const ticketEmbed = new EmbedBuilder()
             .setTitle(`${categoryData.name} #${ticketId}`)
             .setColor(categoryData.color)
             .setDescription(`**Ticket utworzony przez:** ${user}\n**Kategoria:** ${categoryData.description}`)
             .addFields(
                 { name: '🆔 ID Ticketu', value: ticketId, inline: true },
                 { name: '👤 Użytkownik', value: user.tag, inline: true },
                 { name: '📅 Utworzony', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
                 { name: '📊 Status', value: '🟢 Otwarty', inline: true },
                 { name: '⚡ Priorytet', value: formatPriority(categoryData.priority || 2), inline: true }
             )
             .setFooter({ text: 'BotNexus' })
             .setTimestamp();

          const actionRow = new ActionRowBuilder();
          
          // Przycisk Claim
          actionRow.addComponents(
              new ButtonBuilder()
                  .setCustomId(`ticket_claim_${ticketId}`)
                  .setLabel('✅ Zajmij')
                  .setStyle(ButtonStyle.Success)
                  .setEmoji('👷')
          );
          
          // Przycisk Transfer
          actionRow.addComponents(
              new ButtonBuilder()
                  .setCustomId(`ticket_transfer_${ticketId}`)
                  .setLabel('🔄 Przenieś')
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji('🔀')
          );
          
          // Przycisk Note
          actionRow.addComponents(
              new ButtonBuilder()
                  .setCustomId(`ticket_note_${ticketId}`)
                  .setLabel('📝 Notatka')
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji('📌')
          );
          
          // Przycisk Priority
          actionRow.addComponents(
              new ButtonBuilder()
                  .setCustomId(`ticket_priority_${ticketId}`)
                  .setLabel('⚡ Priorytet')
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji('⚡')
          );
          
          // Przycisk Close
          actionRow.addComponents(
              new ButtonBuilder()
                  .setCustomId(`ticket_close_${ticketId}`)
                  .setLabel('🔒 Zamknij')
                  .setStyle(ButtonStyle.Danger)
                  .setEmoji('🔐')
          );

         const welcomeMessage = await ticketChannel.send({
             content: `${user} Witaj w swoim tickecie! Opisz swój problem, a support odpowie jak najszybciej.`,
             embeds: [ticketEmbed],
             components: [actionRow]
         });

         // Zapisz wiadomość powitalną do bazy
         addTicketMessage(
             welcomeMessage.id,
             ticketId,
             guild.id, // System message
             `System: Ticket utworzony przez ${user.tag} (${user.id})`,
             []
         );

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

export async function handleTicketCloseButton(interaction) {
    const ticketId = interaction.customId.replace('ticket_close_', '');
    
    const channel = interaction.channel;
    const user = interaction.user;

    const ticket = getTicketByChannel(channel.id);
    if (ticket && ticket.id === ticketId) {
        await closeTicketById(interaction, ticket, ticket.user_id);
        return;
    }

    await interaction.reply({ content: 'Ten ticket nie został znaleziony!', ephemeral: true });
}

async function closeTicket(message, ticketId) {
    if (!message.guild) return;

    const ticket = getTicketById(ticketId);
    if (ticket) {
        const channel = await message.guild.channels.fetch(ticket.channel_id);
        if (channel) {
            // Wygeneruj transkrypcję przed usunięciem
            const transcript = await generateTranscript(ticket, message.guild);
            if (transcript) {
                try {
                    await message.channel.send({
                        content: '📄 **Transkrypcja ticketu:**',
                        files: [{
                            attachment: transcript,
                            name: `transcript-${ticket.id}.txt`
                        }]
                    });
                } catch (err) {
                    console.error('❌ Błąd wysyłania transkrypcji:', err);
                }
            }
            
            await channel.delete();
        }
        closeTicketInDb(ticketId, message.author.id, 'Closed by command');
        return message.reply(`Ticket #${ticketId} został zamknięty.`);
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
        .addFields(
            { name: '👤 Zamykający', value: `<@${interaction.user.id}>`, inline: true },
            { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
        )
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();

    await channel.send({ embeds: [closeEmbed] });

    // Zapisz zamknięcie do bazy
    closeTicketInDb(ticket.id, interaction.user.id, 'Closed by button');

    // Wygeneruj transkrypcję
    const transcript = await generateTranscript(ticket, interaction.guild);
    if (transcript) {
        await channel.send({
            content: '📄 **Transkrypcja rozmowy:**',
            files: [{
                attachment: transcript,
                name: `transcript-${ticket.id}.txt`
            }]
        });
    }

    // Oczekuj na ocenę od użytkownika (tylko jeśli zamknął support)
    if (interaction.user.id !== ownerId) {
        await requestRating(interaction, ticket, owner);
    }

    setTimeout(async () => {
        try {
            await channel.delete();
        } catch {}
    }, 5000);
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

export async function handleTicketClaimButton(interaction) {
    try {
        const ticketId = interaction.customId.replace('ticket_claim_', '');
        const ticket = getTicketById(ticketId);
        
        if (!ticket) {
            return interaction.reply({ content: '❌ Ticket nie znaleziony!', ephemeral: true });
        }
        
        if (ticket.channel_id !== interaction.channel.id) {
            return interaction.reply({ content: '❌ Ten przycisk nie należy do tego ticketu!', ephemeral: true });
        }
        
        // Sprawdź uprawnienia - musi mieć rolę supportu
        const supportRole = await interaction.guild.roles.fetch(SUPPORT_ROLE_ID);
        if (!supportRole || !interaction.member.roles.cache.has(supportRole.id)) {
            return interaction.reply({ 
                content: '❌ Tylko członkowie supportu mogą zajmować tickety!', 
                ephemeral: true 
            });
        }
        
        if (ticket.status === 'claimed') {
            if (ticket.claimed_by === interaction.user.id) {
                return interaction.reply({ content: 'Już zajmujesz ten ticket!', ephemeral: true });
            }
            const claimedBy = await interaction.guild.members.fetch(ticket.claimed_by).catch(() => null);
            return interaction.reply({ 
                content: `❌ Ten ticket jest już zajęty przez ${claimedBy || 'kogoś innego'}!`, 
                ephemeral: true 
            });
        }
        
        updateTicketStatus(ticketId, 'claimed', interaction.user.id);
        
        // Zaktualizuj embed statusu
        const statusEmbed = new EmbedBuilder()
            .setTitle('✅ Ticket zajęty')
            .setColor(0x57F287)
            .setDescription(`${interaction.user} przejął odpowiedzialność za ten ticket`)
            .addFields(
                { name: '👤 Support', value: `<@${interaction.user.id}>`, inline: true },
                { name: '📅 Czas', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: 'Claim • BotNexus' })
            .setTimestamp();
        
        await interaction.channel.send({ embeds: [statusEmbed] });
        await interaction.reply({ content: '✅ Zająłeś ticket!', ephemeral: true });
        
    } catch (error) {
        console.error('❌ Błąd claim ticketu:', error);
        await interaction.reply({ 
            content: '❌ Wystąpił błąd podczas zajmowania ticketu!', 
            ephemeral: true 
        });
    }
}

export async function handleTicketTransferButton(interaction) {
    try {
        const ticketId = interaction.customId.replace('ticket_transfer_', '');
        const ticket = getTicketById(ticketId);
        
        if (!ticket) {
            return interaction.reply({ content: '❌ Ticket nie znaleziony!', ephemeral: true });
        }
        
        if (ticket.channel_id !== interaction.channel.id) {
            return interaction.reply({ content: '❌ Ten przycisk nie należy do tego ticketu!', ephemeral: true });
        }
        
        // Sprawdź uprawnienia
        const supportRole = await interaction.guild.roles.fetch(SUPPORT_ROLE_ID);
        if (!supportRole || !interaction.member.roles.cache.has(supportRole.id)) {
            return interaction.reply({ 
                content: '❌ Tylko członkowie supportu mogą przenosić tickety!', 
                ephemeral: true 
            });
        }
        
        // Znajdź dostępnych członków supportu
        const availableMembers = interaction.guild.members.cache
            .filter(m => m.roles.cache.has(supportRole.id) && !m.user.bot && m.id !== ticket.claimed_by);
        
        if (availableMembers.size === 0) {
            return interaction.reply({ 
                content: '❌ Brak dostępnych członków supportu do przeniesienia!', 
                ephemeral: true 
            });
        }
        
        // Stwórz select menu z dostępnymi członkami
        const row = new ActionRowBuilder().addComponents(
            new StringSelectBuilder()
                .setCustomId(`transfer_select_${ticketId}`)
                .setPlaceholder('Wybierz nowego obsługującego...')
                .addOptions(
                    availableMembers.map(m => ({
                        label: m.user.tag,
                        value: m.id,
                        description: m.user.username,
                        emoji: m.presence?.status === 'online' ? '🟢' : m.presence?.status === 'idle' ? '🟠' : '⚫'
                    }))
                )
        );
        
        const embed = new EmbedBuilder()
            .setTitle('🔄 Przeniesienie ticketu')
            .setColor(0x5865F2)
            .setDescription('Wybierz nowego członka supportu, który przejmie ten ticket')
            .setFooter({ text: 'Ticket Transfer • BotNexus' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        
    } catch (error) {
        console.error('❌ Błąd transfer ticketu:', error);
        await interaction.reply({ 
            content: '❌ Wystąpił błąd podczas przenoszenia ticketu!', 
            ephemeral: true 
        });
    }
}

export async function handleTicketTransferSelect(interaction) {
    try {
        const ticketId = interaction.customId.replace('transfer_select_', '');
        const newSupportId = interaction.values[0];
        const ticket = getTicketById(ticketId);
        
        if (!ticket) {
            return interaction.reply({ content: '❌ Ticket nie znaleziony!', ephemeral: true });
        }
        
        const newSupport = await interaction.guild.members.fetch(newSupportId).catch(() => null);
        if (!newSupport) {
            return interaction.reply({ content: '❌ Nowy support nie został znaleziony!', ephemeral: true });
        }
        
        updateTicketStatus(ticketId, 'claimed', newSupportId);
        
        const embed = new EmbedBuilder()
            .setTitle('🔄 Ticket przeniesiony')
            .setColor(0x5865F2)
            .setDescription(`Ticket został przeniesiony do ${newSupport}`)
            .addFields(
                { name: '👤 Nowy support', value: `<@${newSupportId}>`, inline: true },
                { name: '👤 Stary support', value: ticket.claimed_by ? `<@${ticket.claimed_by}>` : 'Brak', inline: true },
                { name: '📅 Czas', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: 'Transfer • BotNexus' })
            .setTimestamp();
        
        await interaction.channel.send({ embeds: [embed] });
        // interaction.message może być null dla ephemeral - nie usuwamy
        await interaction.reply({ content: '✅ Ticket przeniesiony!', ephemeral: true });
        
    } catch (error) {
        console.error('❌ Błąd transfer select:', error);
        await interaction.reply({ 
            content: '❌ Wystąpił błąd podczas przenoszenia!', 
            ephemeral: true 
        });
    }
}

export async function handleRatingButton(interaction) {
    try {
        const parts = interaction.customId.split('_');
        const ticketId = parts[1];
        const rating = parseInt(parts[2]);
        
        const ticket = getTicketById(ticketId);
        if (!ticket) {
            return interaction.reply({ content: '❌ Ticket nie znaleziony!', ephemeral: true });
        }
        
        if (ticket.status === 'closed') {
            return interaction.reply({ 
                content: '❌ Ten ticket jest już zamknięty!', 
                ephemeral: true 
            });
        }
        
        // Zapisz rating
        rateTicket(ticketId, rating, 'Rating from user');
        
        // Zaktualizuj status na waiting_for_user (jeśli jeszcze nie zamknięty)
        if (ticket.status !== 'waiting_for_user') {
            updateTicketStatus(ticketId, 'waiting_for_user');
        }
        
        const ratingEmbed = new EmbedBuilder()
            .setTitle('⭐ Dziękujemy za ocenę!')
            .setColor(0x5865F2)
            .setDescription(`Oceniłeś naszą obsługę na **${rating}/5** gwiazdek!`)
            .addFields(
                { name: '🎫 Ticket', value: `#${ticketId}`, inline: true },
                { name: '👤 Użytkownik', value: `<@${ticket.user_id}>`, inline: true }
            )
            .setFooter({ text: 'Dziękujemy! • BotNexus' })
            .setTimestamp();
        
        await interaction.message.delete();
        await interaction.reply({ embeds: [ratingEmbed], ephemeral: true });
        
        // Zamknij ticket automatycznie po ocenie
        setTimeout(async () => {
            try {
                const chan = await interaction.guild.channels.fetch(ticket.channel_id);
                if (chan) {
                    closeTicketInDb(ticketId, interaction.user.id, 'Ticket closed after rating');
                    await chan.delete();
                }
            } catch (err) {
                console.error('❌ Błąd auto-close po ratingu:', err);
            }
        }, 3000);
        
    } catch (error) {
        console.error('❌ Błąd ratingu:', error);
        await interaction.reply({ 
            content: '❌ Wystąpił błąd podczas oceny!', 
            ephemeral: true 
        });
    }
}

// Auto-close nieaktywnych ticketów (wywoływana periodycznie)
function autoCloseInactiveTickets(guild) {
    const inactiveTickets = getInactiveTickets();
    let closedCount = 0;
    
    for (const ticket of inactiveTickets) {
        try {
            const channel = guild.channels.cache.get(ticket.channel_id);
            if (channel) {
                const embed = new EmbedBuilder()
                    .setTitle('⏰ Ticket automatycznie zamknięty')
                    .setColor(0xED4245)
                    .setDescription('Ticket został zamknięty z powodu braku aktywności przez 24 godziny.')
                    .addFields(
                        { name: '🆔 ID', value: ticket.id, inline: true },
                        { name: '📅 Ostatnia aktywność', value: `<t:${Math.floor(ticket.last_activity / 1000)}:R>`, inline: true }
                    )
                    .setFooter({ text: 'Auto-close • BotNexus' })
                    .setTimestamp();
                
                channel.send({ embeds: [embed] }).catch(() => {});
            }
            
            closeTicketInDb(ticket.id, null, 'Auto-close: brak aktywności przez 24h');
            closedCount++;
        } catch (err) {
            console.error(`❌ Błąd auto-close ticket ${ticket.id}:`, err);
        }
    }
    
    return closedCount;
}

export async function handleTicketPriorityButton(interaction) {
    try {
        const ticketId = interaction.customId.replace('ticket_priority_', '');
        const ticket = getTicketById(ticketId);
        
        if (!ticket) {
            return interaction.reply({ content: '❌ Ticket nie znaleziony!', ephemeral: true });
        }
        
        if (ticket.channel_id !== interaction.channel.id) {
            return interaction.reply({ content: '❌ Ten przycisk nie należy do tego ticketu!', ephemeral: true });
        }
        
        const supportRole = await interaction.guild.roles.fetch(SUPPORT_ROLE_ID);
        if (!supportRole || !interaction.member.roles.cache.has(supportRole.id)) {
            return interaction.reply({ 
                content: '❌ Tylko członkowie supportu mogą zmieniać priorytet!', 
                ephemeral: true 
            });
        }
        
        const priorityEmojis = ['🔴', '🟠', '🟡', '🟢'];
        const priorityLabels = ['Krytyczny', 'Wysoki', 'Średni', 'Niski'];
        
        const row = new ActionRowBuilder().addComponents(
            new StringSelectBuilder()
                .setCustomId(`priority_select_${ticketId}`)
                .setPlaceholder('Wybierz priorytet...')
                .addOptions(
                    [0, 1, 2, 3].map(p => ({
                        label: `${priorityLabels[p]} (${p})`,
                        value: p.toString(),
                        description: `Priorytet: ${priorityLabels[p]}`,
                        emoji: priorityEmojis[p]
                    }))
                )
        );
        
        const embed = new EmbedBuilder()
            .setTitle('⚡ Zmień priorytet ticketu')
            .setColor(0x5865F2)
            .setDescription(`Aktualny priorytet: **${formatPriority(ticket.priority)}**`)
            .setFooter({ text: 'Ticket Priority • BotNexus' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        
    } catch (error) {
        console.error('❌ Błąd priorytetu:', error);
        await interaction.reply({ content: '❌ Wystąpił błąd!', ephemeral: true });
    }
}

export async function handleTicketPrioritySelect(interaction) {
    try {
        const ticketId = interaction.customId.replace('priority_select_', '');
        const newPriority = parseInt(interaction.values[0]);
        
        const ticket = getTicketById(ticketId);
        if (!ticket) {
            return interaction.reply({ content: '❌ Ticket nie znaleziony!', ephemeral: true });
        }
        
        const supportRole = await interaction.guild.roles.fetch(SUPPORT_ROLE_ID);
        if (!supportRole || !interaction.member.roles.cache.has(supportRole.id)) {
            return interaction.reply({ 
                content: '❌ Tylko support może zmieniać priorytet!', 
                ephemeral: true 
            });
        }
        
        setTicketPriority(ticketId, newPriority);
        
        const channel = interaction.guild.channels.cache.get(ticket.channel_id);
        if (channel) {
            const messages = await channel.messages.fetch({ limit: 50 });
            const ticketMessage = messages.find(m => 
                m.embeds.length > 0 && 
                m.embeds[0].title?.includes(`#${ticketId}`)
            );
            
            if (ticketMessage) {
                const embed = ticketMessage.embeds[0];
                const priorityFieldIndex = embed.data.fields?.findIndex(f => f.name === '⚡ Priorytet');
                
                if (priorityFieldIndex !== -1) {
                    embed.data.fields[priorityFieldIndex].value = formatPriority(newPriority);
                    await ticketMessage.edit({ embeds: [embed] });
                }
            }
        }
        
        const embed = new EmbedBuilder()
            .setTitle('⚡ Priorytet zaktualizowany')
            .setColor(0x5865F2)
            .setDescription(`Priorytet ticketu #${ticketId} zmieniony na **${formatPriority(newPriority)}**`)
            .addFields(
                { name: '👤 Zmienił', value: `<@${interaction.user.id}>`, inline: true },
                { name: '📅 Czas', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: 'Priority Updated • BotNexus' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
        
        if (TICKET_LOG_CHANNEL_ID) {
            const logChannel = interaction.guild.channels.cache.get(TICKET_LOG_CHANNEL_ID);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('⚡ Zmiana priorytetu')
                    .setColor(0x5865F2)
                    .addFields(
                        { name: '🎫 Ticket', value: `#${ticketId}`, inline: true },
                        { name: '👤 Zmienił', value: `<@${interaction.user.id}>`, inline: true },
                        { name: '📊 Nowy priorytet', value: formatPriority(newPriority), inline: true }
                    )
                    .setFooter({ text: 'Ticket Priority Change' })
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] }).catch(() => {});
            }
        }
        
    } catch (error) {
        console.error('❌ Błąd zmiany priorytetu:', error);
        await interaction.reply({ content: '❌ Wystąpił błąd!', ephemeral: true });
    }
}

// Komenda ustawiania priorytetu
async function setPriorityCommand(message, ticketId, priorityStr) {
    if (!message.guild) return;
    
    // Sprawdź uprawnienia
    const supportRole = await message.guild.roles.fetch(SUPPORT_ROLE_ID).catch(() => null);
    if (!supportRole || !message.member.roles.cache.has(supportRole.id)) {
        return message.reply('❌ Tylko support może zmieniać priorytety!');
    }
    
    const priority = parseInt(priorityStr);
    if (isNaN(priority) || priority < 0 || priority > 3) {
        return message.reply('❌ Nieprawidłowy priorytet! Użyj wartości 0-3 (0=Krytyczny, 1=Wysoki, 2=Średni, 3=Niski)');
    }
    
    const ticket = getTicketById(ticketId);
    if (!ticket) {
        return message.reply('❌ Ticket nie znaleziony!');
    }
    
    const oldPriority = ticket.priority;
    setTicketPriority(ticketId, priority);
    
    const embed = new EmbedBuilder()
        .setTitle('⚡ Priorytet zmieniony')
        .setColor(0x5865F2)
        .setDescription(`Ticket #${ticketId}\nPriorytet: ${formatPriority(oldPriority)} → ${formatPriority(priority)}`)
        .addFields(
            { name: '👤 Zmienił', value: `<@${message.author.id}>`, inline: true },
            { name: '📅 Czas', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
        )
        .setFooter({ text: 'Priority Change • BotNexus' })
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
    
    // Log
    if (TICKET_LOG_CHANNEL_ID) {
        const logChannel = message.guild.channels.cache.get(TICKET_LOG_CHANNEL_ID);
        if (logChannel) {
            logChannel.send({ embeds: [embed] }).catch(() => {});
        }
    }
}

// Dodaj notatkę do ticketu
async function addNote(message, ticketId, content) {
    if (!message.guild) return;
    
    const supportRole = await message.guild.roles.fetch(SUPPORT_ROLE_ID).catch(() => null);
    if (!supportRole) {
        return message.reply('❌ Rola supportu nie znaleziona!');
    }
    
    const staffMembers = message.guild.members.cache
        .filter(m => m.roles.cache.has(supportRole.id) && !m.user.bot);
    
    const embed = new EmbedBuilder()
        .setTitle('📊 Statystyki Personelu Support')
        .setColor(0x5865F2)
        .setFooter({ text: `Łącznie: ${staffMembers.size} członków` })
        .setTimestamp();
    
    for (const member of staffMembers.values()) {
        const stats = getStaffStats(member.id, message.guild.id);
        const ticketCount = stats.total || 0;
        const closedCount = stats.closed || 0;
        const avgRating = stats.avg_rating ? stats.avg_rating.toFixed(1) : 'N/A';
        
        embed.addFields({
            name: `<@${member.id}>`,
            value: `📋 Tickets: ${ticketCount} | ✅ Zamknięte: ${closedCount} | ⭐ Średnia: ${avgRating}/5`,
            inline: false
        });
    }
    
    await message.reply({ embeds: [embed] });
}

// Ręczne uruchomienie auto-close (admin only)
async function runAutoClose(message, targetGuildId) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply('❌ Tylko administratorzy mogą uruchamiać ręczne auto-close!');
    }
    
    try {
        const guild = message.client.guilds.cache.get(targetGuildId);
        if (!guild) {
            return message.reply('❌ Serwer nie znaleziony!');
        }
        
        const closedCount = autoCloseInactiveTickets(guild);
        return message.reply(`✅ Zamknięto ${closedCount} nieaktywnych ticketów na serwerze ${guild.name}`);
    } catch (err) {
        console.error('❌ Błąd auto-close:', err);
        return message.reply('❌ Wystąpił błąd podczas auto-close!');
    }
}

async function listTickets(message) {
    if (!message.guild) return;

    const userId = message.author.id;
    const tickets = getUserTickets(userId, message.guild.id);

    if (!tickets || tickets.length === 0) {
        return message.reply('Nie masz żadnych otwartych ticketów.');
    }

    let description = '';
    for (const ticket of tickets) {
        const categoryData = ticketCategories[ticket.category];
        const channel = await message.guild.channels.fetch(ticket.channel_id).catch(() => null);
        description += `**#${ticket.id}** - ${categoryData.name} ${formatPriority(ticket.priority)} ${channel ? `- <#${ticket.channel_id}>` : '(kanał usunięty)'}\n`;
    }

    const embed = new EmbedBuilder()
        .setTitle('📋 Twoje tickety')
        .setColor(0x5865F2)
        .setDescription(description)
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
}