import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, Colors, StringSelectBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../database.js';

console.log('✅ commands/ticket.js loaded');

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

    if (args[0] === 'tag' && args[1] === 'add' && args[2] && args[3]) {
        return addTagCommand(message, args[2], args[3]);
    }
    
    if (args[0] === 'tag' && args[1] === 'remove' && args[2] && args[3]) {
        return removeTagCommand(message, args[2], args[3]);
    }

    if (args[0] === 'quick' && args[1]) {
        return sendQuickResponseCommand(message, args[1]);
    }

    if (args[0] === 'transfercat' && args[1] && args[2]) {
        return transferTicketCategory(message, args[1], args[2]);
    }

    if (args[0] === 'export') {
        return exportTicketsCommand(message);
    }

    if (args[0] === 'cooldown') {
        return checkUserCooldownCommand(message, message.author.id);
    }

    if (args[0] === 'staff') {
        return showStaffStats(message);
    }

    if (args[0] === 'autoclose' && args[1]) {
        return runAutoClose(message, args[1]);
    }

    return message.reply('Dostępne komendy ticket:\n- !ticket - panel wyboru\n- !ticket send <#kanał> - wyślij panel na kanał\n- !ticket list - lista twoich ticketów\n- !ticket close <id> - zamknij ticket\n- !ticket note <id> <treść> - dodaj notatkę do ticketu\n- !ticket priority <id> <0-3> - zmień priorytet (0=Krytyczny, 3=Niski)\n- !ticket tag add <id> <tag> - dodaj tag\n- !ticket tag remove <id> <tag> - usuń tag\n- !ticket quick <id> - szybka odpowiedź\n- !ticket transfercat <id> <kategoria> - zmień kategorię\n- !ticket export - eksport CSV (admin)\n- !ticket cooldown - sprawdź cooldown\n- !ticket staff - statystyki personelu\n- !ticket autoclose <guild_id> - ręczne auto-close (admin)\n- !ticket uptime - statystyki bota\n- !ticket channel <#kanał> - ustaw kanał ticketów\n- !ticket logchannel <#kanał> - ustaw kanał logów ticketów\n- !ticket config - pokaż aktualną konfigurację');
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
        const customId = interaction.customId;
        
        // Dispatch do odpowiednich handlerów
        if (customId.startsWith('ticket_claim_')) {
            return handleTicketClaimButton(interaction);
        }
        if (customId.startsWith('ticket_transfer_')) {
            return handleTicketTransferButton(interaction);
        }
        if (customId.startsWith('ticket_note_')) {
            return handleTicketNoteButton(interaction);
        }
        if (customId.startsWith('ticket_priority_')) {
            return handleTicketPriorityButton(interaction);
        }
        if (customId.startsWith('ticket_tags_')) {
            return handleTicketTagsButton(interaction);
        }
        if (customId.startsWith('ticket_quick_')) {
            return handleQuickResponseButton(interaction);
        }
        if (customId.startsWith('ticket_transfercat_')) {
            return handleTicketTransferCategoryButton(interaction);
        }
        
        // Stare przyciski tworzenia ticketu (kategorie)
        const category = customId.replace('ticket_', '');
        const categoryData = ticketCategories[category];

        if (!categoryData) {
            return interaction.reply({ 
                content: '❌ Nieprawidłowa kategoria ticketu!', 
                ephemeral: true 
            });
        }

        const guild = interaction.guild;
        const user = interaction.user;

        // Sprawdź cooldown
        const cooldown = checkUserCooldown(user.id);
        if (!cooldown.allowed) {
            return interaction.reply({ 
                content: `⏳ Musisz poczekać jeszcze **${cooldown.remaining} minut** przed utworzeniem nowego ticketu.`,
                ephemeral: true 
            });
        }

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
        
        // Ustaw cooldown na 10 minut
        setUserCooldown(user.id, 10);
        
        // Spróbuj auto-claim jeśli jest dostępny support
        const availableStaff = await findAvailableSupportMember(guild);
        if (availableStaff) {
            await autoClaimTicket(ticketId, ticketChannel, availableStaff);
        }

        // Rozpocznij śledzenie eskalacji (tylko dla ticketów bez auto-claim)
        if (!availableStaff) {
            startEscalationTimer(ticketId, ticketChannel, user);
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
          
          // Przycisk Transfer Support
          actionRow.addComponents(
              new ButtonBuilder()
                  .setCustomId(`ticket_transfer_${ticketId}`)
                  .setLabel('🔄 Transfer')
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji('🔀')
          );
          
          // Przycisk Transfer Category
          actionRow.addComponents(
              new ButtonBuilder()
                  .setCustomId(`ticket_transfercat_${ticketId}`)
                  .setLabel('📁 Kategoria')
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji('📂')
          );
          
          // Przycisk Note
          actionRow.addComponents(
              new ButtonBuilder()
                  .setCustomId(`ticket_note_${ticketId}`)
                  .setLabel('📝 Notatka')
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji('📌')
          );
          
          // Przycisk Tags
          actionRow.addComponents(
              new ButtonBuilder()
                  .setCustomId(`ticket_tags_${ticketId}`)
                  .setLabel('🏷️ Tagi')
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji('🏷️')
          );

          // Przycisk Quick Response
          actionRow.addComponents(
              new ButtonBuilder()
                  .setCustomId(`ticket_quick_${ticketId}`)
                  .setLabel('⚡ Quick')
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji('💬')
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

// ========== ESKALACJA TICKETU ==========
// Czas eskalacji w minutach
const ESCALATION_TIMES = [15, 30, 60]; // minuty
const ESCALATION_ROLES = ['1499838769254367391']; // support role ID (można dodać admin role)

function startEscalationTimer(ticketId, channel, creator) {
    let escalationLevel = 0;
    
    const escalationInterval = setInterval(async () => {
        const ticket = getTicketById(ticketId);
        if (!ticket || ticket.status === 'closed') {
            clearInterval(escalationInterval);
            return;
        }
        
        // Sprawdź czy jest aktywność (ostatnia wiadomość)
        // Dla prostoty: eskaluj nawet bez aktywności - czas od utworzenia
        const createdTime = ticket.created_at;
        const now = Date.now();
        const minutesSinceCreation = (now - createdTime) / 60000;
        
        if (minutesSinceCreation >= ESCALATION_TIMES[escalationLevel]) {
            await sendEscalationAlert(ticket, channel, escalationLevel, creator);
            escalationLevel++;
            
            if (escalationLevel >= ESCALATION_TIMES.length) {
                clearInterval(escalationInterval);
                // Po 60 min - ping adminów lub zablokuj tworzenie ticketów?
                await sendMaxEscalationAlert(ticket, channel);
            }
        }
    }, 60000); // Sprawdzaj co minutę
}

async function sendEscalationAlert(ticket, channel, level, creator) {
    const guild = channel.guild;
    const supportRole = await guild.roles.fetch(SUPPORT_ROLE_ID).catch(() => null);
    
    const levelMessages = [
        `⏰ **Eskalacja 1/2** - Ticket #${ticket.id} czeka już ${ESCALATION_TIMES[0]} minut!`,
        `⚠️ **Eskalacja 2/2** - Ticket #${ticket.id} czeka już ${ESCALATION_TIMES[1]} minut!`,
        `🚨 **MAX ESKALACJA** - Ticket #${ticket.id} czeka już ${ESCALATION_TIMES[2]} minut!`
    ];
    
    const pingMentions = level === 2 ? `@here ${supportRole ? `<@&${supportRole.id}>` : ''}` : (supportRole ? `<@&${supportRole.id}>` : '@here');
    
    const embed = new EmbedBuilder()
        .setTitle('🚨 Eskalacja ticketu')
        .setColor(level === 2 ? 0xFF0000 : 0xFFA500)
        .setDescription(levelMessages[level])
        .addFields(
            { name: '👤 Użytkownik', value: `<@${ticket.user_id}>`, inline: true },
            { name: '📂 Kategoria', value: ticketCategories[ticket.category]?.name || ticket.category, inline: true },
            { name: '⚡ Priorytet', value: formatPriority(ticket.priority), inline: true }
        )
        .setFooter({ text: `Escalation Level ${level + 1}/${ESCALATION_TIMES.length}` })
        .setTimestamp();
    
    try {
        await channel.send({
            content: pingMentions,
            embeds: [embed]
        });
        
        // Log
        if (TICKET_LOG_CHANNEL_ID) {
            const logChannel = guild.channels.cache.get(TICKET_LOG_CHANNEL_ID);
            if (logChannel) {
                logChannel.send({ 
                    content: `Eskalacja ticketu #${ticket.id} - poziom ${level + 1}`,
                    embeds: [embed] 
                }).catch(() => {});
            }
        }
    } catch (err) {
        console.error('❌ Błąd eskalacji:', err);
    }
}

async function sendMaxEscalationAlert(ticket, channel) {
    const guild = channel.guild;
    // Znajdź rolę admina (możesz dodać ID admin role w config)
    const adminRole = await guild.roles.fetch('1499838769254367391').catch(() => null); // tymczasowo użyj support role
    
    const embed = new EmbedBuilder()
        .setTitle('🚨 MAX ESKALACJA - Ticket potrzebuje natychmiastowej uwagi!')
        .setColor(0xFF0000)
        .setDescription(`Ticket #${ticket.id} nie został odpowiedziany przez ${ESCALATION_TIMES[2]} minut!`)
        .addFields(
            { name: '👤 Użytkownik', value: `<@${ticket.user_id}>`, inline: true },
            { name: '📂 Kategoria', value: ticketCategories[ticket.category]?.name || ticket.category, inline: true },
            { name: '📅 Utworzony', value: `<t:${Math.floor(ticket.created_at / 1000)}:R>`, inline: true }
        )
        .setFooter({ text: 'MAX ESCALATION - Action Required!' })
        .setTimestamp();
    
    const ping = adminRole ? `<@&${adminRole.id}>` : '@here';
    
    try {
        await channel.send({
            content: `${ping} **TICKET W MAX ESKALACJI!**`,
            embeds: [embed]
        });
    } catch (err) {
        console.error('❌ Błąd max eskalacji:', err);
    }
}

export async function handleTicketTransferCategoryButton(interaction) {
    try {
        const ticketId = interaction.customId.replace('ticket_transfercat_', '');
        const ticket = getTicketById(ticketId);
        
        if (!ticket) {
            return interaction.reply({ content: '❌ Ticket nie znaleziony!', ephemeral: true });
        }
        
        if (ticket.channel_id !== interaction.channel.id) {
            return interaction.reply({ content: '❌ Ten przycisk nie należy do tego ticketu!', ephemeral: true });
        }
        
        // Sprawdź uprawnienia supportu
        const supportRole = await interaction.guild.roles.fetch(SUPPORT_ROLE_ID);
        if (!supportRole || !interaction.member.roles.cache.has(supportRole.id)) {
            return interaction.reply({ 
                content: '❌ Tylko członkowie supportu mogą zmieniać kategorię!', 
                ephemeral: true 
            });
        }
        
        // Stwórz select menu z kategoriami
        const row = new ActionRowBuilder().addComponents(
            new StringSelectBuilder()
                .setCustomId(`category_transfer_select_${ticketId}`)
                .setPlaceholder('Wybierz nową kategorię...')
                .addOptions(
                    Object.entries(ticketCategories).map(([key, cat]) => ({
                        label: cat.name,
                        value: key,
                        description: cat.description,
                        emoji: cat.name.split(' ')[0] // emoji z nazwy
                    }))
                )
        );
        
        const embed = new EmbedBuilder()
            .setTitle('📁 Zmień kategorię ticketu')
            .setColor(0x5865F2)
            .setDescription(`Aktualna kategoria: **${ticketCategories[ticket.category].name}**`)
            .setFooter({ text: 'Category Transfer • BotNexus' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        
    } catch (error) {
        console.error('❌ Błąd transferu kategorii:', error);
        await interaction.reply({ content: '❌ Wystąpił błąd!', ephemeral: true });
    }
}

export async function handleCategoryTransferSelect(interaction) {
    try {
        const ticketId = interaction.customId.replace('category_transfer_select_', '');
        const newCategory = interaction.values[0];
        const ticket = getTicketById(ticketId);
        
        if (!ticket) {
            return interaction.reply({ content: '❌ Ticket nie znaleziony!', ephemeral: true });
        }
        
        const supportRole = await interaction.guild.roles.fetch(SUPPORT_ROLE_ID);
        if (!supportRole || !interaction.member.roles.cache.has(supportRole.id)) {
            return interaction.reply({ 
                content: '❌ Tylko support może zmieniać kategorię!', 
                ephemeral: true 
            });
        }
        
        // Zmień kategorię (użyj istniejącej funkcji, ale bez message object)
        // Musimy zmodyfikować transferTicketCategory aby przyjmowała interaction
        const oldCategory = ticket.category;
        const stmt = db.prepare('UPDATE tickets SET category = ? WHERE id = ?');
        stmt.run(newCategory, ticketId);
        
        const channel = interaction.guild.channels.cache.get(ticket.channel_id);
        if (channel) {
            const embed = new EmbedBuilder()
                .setTitle('🔄 Kategoria ticketu zmieniona')
                .setColor(ticketCategories[newCategory].color)
                .setDescription(`Ticket #${ticketId} przeniesiony do kategorii **${ticketCategories[newCategory].name}**`)
                .addFields(
                    { name: '👤 Zmienił', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '📂 Stara kategoria', value: ticketCategories[oldCategory].name, inline: true },
                    { name: '📂 Nowa kategoria', value: ticketCategories[newCategory].name, inline: true }
                )
                .setFooter({ text: 'Category Transfer • BotNexus' })
                .setTimestamp();
            
            await channel.send({ embeds: [embed] });
            
            // Log
            if (TICKET_LOG_CHANNEL_ID) {
                const logChannel = interaction.guild.channels.cache.get(TICKET_LOG_CHANNEL_ID);
                logChannel?.send({ embeds: [embed] }).catch(() => {});
            }
        }
        
        await interaction.message.delete();
        await interaction.reply({ 
            content: `✅ Kategoria zmieniona na ${ticketCategories[newCategory].name}`, 
            ephemeral: true 
        });
        
    } catch (error) {
        console.error('❌ Błąd category transfer select:', error);
        await interaction.reply({ content: '❌ Wystąpił błąd!', ephemeral: true });
    }
}

export async function handleQuickResponseSelect(interaction) {
    try {
        const ticketId = interaction.customId.replace('quick_select_', '');
        const responseId = interaction.values[0];
        const ticket = getTicketById(ticketId);
        
        if (!ticket) {
            return interaction.reply({ content: '❌ Ticket nie znaleziony!', ephemeral: true });
        }
        
        const response = QUICK_RESPONSES.find(r => r.id === responseId);
        if (!response) {
            return interaction.reply({ content: '❌ Nieprawidłowa odpowiedź!', ephemeral: true });
        }
        
        const channel = interaction.guild.channels.cache.get(ticket.channel_id);
        if (channel) {
            await channel.send({
                content: response.text,
                embeds: [new EmbedBuilder()
                    .setTitle(response.label)
                    .setColor(0x5865F2)
                    .setFooter({ text: `Quick Response • ${interaction.user.tag}` })
                    .setTimestamp()
                ]
            });
        }
        
        await interaction.message.delete();
        await interaction.reply({ content: `✅ Wysłano: "${response.label}"`, ephemeral: true });
        
    } catch (error) {
        console.error('❌ Błąd quick response select:', error);
        await interaction.reply({ content: '❌ Wystąpił błąd!', ephemeral: true });
    }
}

// ========== COOLDOWN / LIMITY ==========
const userCooldowns = new Map(); // userId -> timestamp next allowed

function checkUserCooldown(userId) {
    const now = Date.now();
    const cooldownEnd = userCooldowns.get(userId) || 0;
    
    if (now < cooldownEnd) {
        const remainingMin = Math.ceil((cooldownEnd - now) / 60000);
        return { allowed: false, remaining: remainingMin };
    }
    
    return { allowed: true };
}

function setUserCooldown(userId, minutes = 10) {
    userCooldowns.set(userId, Date.now() + (minutes * 60 * 1000));
    // Opcjonalnie zapisz do bazy dla trwałości po restarcie
}

// ========== TAGI ==========
function addTicketTag(ticketId, tag) {
    // Pobierz istniejące tagi
    const ticket = getTicketById(ticketId);
    if (!ticket) return false;
    
    const tags = JSON.parse(ticket.tags || '[]');
    if (!tags.includes(tag)) {
        tags.push(tag);
        const stmt = db.prepare('UPDATE tickets SET tags = ? WHERE id = ?');
        stmt.run(JSON.stringify(tags), ticketId);
        return true;
    }
    return false;
}

function removeTicketTag(ticketId, tag) {
    const ticket = getTicketById(ticketId);
    if (!ticket) return false;
    
    const tags = JSON.parse(ticket.tags || '[]');
    const idx = tags.indexOf(tag);
    if (idx > -1) {
        tags.splice(idx, 1);
        const stmt = db.prepare('UPDATE tickets SET tags = ? WHERE id = ?');
        stmt.run(JSON.stringify(tags), ticketId);
        return true;
    }
    return false;
}

function getTicketTags(ticketId) {
    const ticket = getTicketById(ticketId);
    if (!ticket) return [];
    return JSON.parse(ticket.tags || '[]');
}

// ========== QUICK ACTIONS / Szybkie odpowiedzi ==========
const QUICK_RESPONSES = [
    { id: 'checking', label: '🔍 Sprawdzam...', text: 'Sprawdzam to, chwila...' },
    { id: 'need_info', label: '❓ Potrzebuję więcej informacji', text: 'Potrzebuję więcej informacji, aby rozwiązać problem.' },
    { id: 'working_on', label: '🛠️ Pracuję nad tym', text: 'Pracuję nad rozwiązaniem twojego problemu.' },
    { id: 'will_take_time', label: '⏱️ To zajmie trochę czasu', text: 'To może zająć trochę czasu. Dziękuję za cierpliwość!' },
    { id: 'almost_done', label: '✅ Już prawie skończone', text: 'Już prawie skończone! Zostało trochę...' },
    { id: 'closing', label: '🔒 Zamykam ticket', text: 'Ticket zostanie zamknięty. Dziękuję za kontakt!' }
];

async function sendQuickResponse(interaction, responseId) {
    const ticketId = interaction.customId.replace('quick_response_', '').replace('_', '');
    const ticket = getTicketById(ticketId);
    
    if (!ticket || ticket.channel_id !== interaction.channel.id) {
        return interaction.reply({ content: '❌ Ticket nie znaleziony!', ephemeral: true });
    }
    
    const response = QUICK_RESPONSES.find(r => r.id === responseId);
    if (!response) {
        return interaction.reply({ content: '❌ Nieprawidłowa odpowiedź!', ephemeral: true });
    }
    
    const channel = interaction.channel;
    await channel.send({
        content: response.text,
        embeds: [new EmbedBuilder()
            .setTitle(response.label)
            .setColor(0x5865F2)
            .setFooter({ text: `Quick Response • ${interaction.user.tag}` })
            .setTimestamp()
        ]
    });
    
    await interaction.reply({ content: `✅ Wysłano: "${response.label}"`, ephemeral: true });
}

// ========== TRANSFER KATEGORII ==========
async function transferTicketCategory(message, ticketId, newCategory) {
    if (!message.guild) return;
    
    const ticket = getTicketById(ticketId);
    if (!ticket) {
        return message.reply('❌ Ticket nie znaleziony!');
    }
    
    // Sprawdź uprawnienia
    const supportRole = await message.guild.roles.fetch(SUPPORT_ROLE_ID).catch(() => null);
    if (!supportRole || !message.member.roles.cache.has(supportRole.id)) {
        return message.reply('❌ Tylko support może zmieniać kategorie!');
    }
    
    if (!ticketCategories[newCategory]) {
        return message.reply('❌ Nieprawidłowa kategoria! Dostępne: ' + Object.keys(ticketCategories).join(', '));
    }
    
    const oldCategory = ticket.category;
    
    // Aktualizuj bazę
    const stmt = db.prepare('UPDATE tickets SET category = ? WHERE id = ?');
    stmt.run(newCategory, ticketId);
    
    // Znajdź kanał i zaktualizuj embed
    const channel = await message.guild.channels.fetch(ticket.channel_id).catch(() => null);
    if (channel) {
        // Zmień nazwę kanału opcjonalnie lub dodaj informację w embed
        const embed = new EmbedBuilder()
            .setTitle('🔄 Kategoria ticketu zmieniona')
            .setColor(ticketCategories[newCategory].color)
            .setDescription(`Ticket #${ticketId} przeniesiony do kategorii **${ticketCategories[newCategory].name}**`)
            .addFields(
                { name: '👤 Zmienił', value: `<@${message.author.id}>`, inline: true },
                { name: '📂 Stara kategoria', value: ticketCategories[oldCategory].name, inline: true },
                { name: '📂 Nowa kategoria', value: ticketCategories[newCategory].name, inline: true }
            )
            .setFooter({ text: 'Category Transfer • BotNexus' })
            .setTimestamp();
        
        await channel.send({ embeds: [embed] });
    }
    
    // Log
    if (TICKET_LOG_CHANNEL_ID) {
        const logChannel = message.guild.channels.cache.get(TICKET_LOG_CHANNEL_ID);
        if (logChannel) {
            logChannel.send({ embeds: [embed] }).catch(() => {});
        }
    }
    
    return message.reply(`✅ Kategoria ticketu #${ticketId} zmieniona na ${ticketCategories[newCategory].name}`);
}

// ========== EXPORT CSV ==========
function exportTicketsToCSV(guildId) {
    const stmt = db.prepare('SELECT * FROM tickets WHERE guild_id = ? ORDER BY created_at DESC');
    const tickets = stmt.all(guildId);
    
    if (tickets.length === 0) return null;
    
    // CSV header
    let csv = 'ID,ChannelID,UserID,Category,Priority,Status,CreatedAt,ClosedAt,Rating\n';
    
    for (const t of tickets) {
        const createdAt = new Date(t.created_at).toISOString();
        const closedAt = t.closed_at ? new Date(t.closed_at).toISOString() : '';
        
        csv += `${t.id},${t.channel_id},${t.user_id},${t.category},${t.priority},${t.status},${createdAt},${closedAt},${t.rating || ''}\n`;
    }
    
    return Buffer.from(csv, 'utf-8');
}

// Funkcja pomocnicza do odświeżania embedu ticketu (używana w claim/transfer/priority)
async function refreshTicketEmbed(channel, ticketId) {
    try {
        const messages = await channel.messages.fetch({ limit: 50 });
        const ticketMessage = messages.find(m => 
            m.embeds.length > 0 && 
            m.embeds[0].title?.includes(`#${ticketId}`)
        );
        
        if (ticketMessage) {
            const ticket = getTicketById(ticketId);
            if (!ticket) return;
            
            const embed = ticketMessage.embeds[0];
            const categoryData = ticketCategories[ticket.category];
            
            // Znajdź i zaktualizuj pola
            embed.data.title = `${categoryData.name} #${ticketId}`;
            embed.data.color = categoryData.color;
            
            // Zaktualizuj status i priorytet jeśli istnieją
            const statusIndex = embed.data.fields?.findIndex(f => f.name === '📊 Status');
            if (statusIndex !== -1) {
                embed.data.fields[statusIndex].value = formatStatus(ticket.status);
            }
            
            const priorityIndex = embed.data.fields?.findIndex(f => f.name === '⚡ Priorytet');
            if (priorityIndex !== -1) {
                embed.data.fields[priorityIndex].value = formatPriority(ticket.priority);
            }
            
            await ticketMessage.edit({ embeds: [embed] });
        }
    } catch (err) {
        console.error('❌ Błąd odświeżania embedu:', err);
    }
}

// ========== WERYFIKACJA PRZED TWORZENIEM ==========
async function validateTicketCreation(interaction, userId, guildId) {
    // Cooldown
    const cooldown = checkUserCooldown(userId);
    if (!cooldown.allowed) {
        return {
            allowed: false,
            message: `⏳ Musisz poczekać jeszcze **${cooldown.remaining} minut** przed utworzeniem nowego ticketu.`
        };
    }
    
    // Max ticketów (już jest check w handleTicketButton - 5 ticketów)
    
    // Sprawdź czy user nie ma już ticketu w tym samym kanał (duplikat)
    const existingTickets = getUserTickets(userId, guildId);
    
    return { allowed: true };
}

// ========== NOTYFIKACJE PRIVATE MESSAGE ==========
async function sendTicketClosedPM(ticket, closerId, guild) {
    try {
        const user = await guild.members.fetch(ticket.user_id).catch(() => null);
        if (!user) return;
        
        const embed = new EmbedBuilder()
            .setTitle('🔒 Ticket zamknięty')
            .setColor(0xED4245)
            .setDescription(`Twój ticket **#${ticket.id}** został zamknięty.`)
            .addFields(
                { name: '📂 Kategoria', value: ticketCategories[ticket.category]?.name || ticket.category, inline: true },
                { name: '📅 Zamknięty', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
                { name: '👤 Zamknął', value: closerId ? `<@${closerId}>` : 'System', inline: true }
            )
            .setFooter({ text: 'BotNexus • Dziękujemy za kontakt!' })
            .setTimestamp();
        
        if (ticket.rating) {
            embed.addFields({ name: '⭐ Twoja ocena', value: `${ticket.rating}/5`, inline: true });
        }
        
        // Wyślij DM (nie wszystkie API mają włączone DM)
        await user.send({ 
            content: 'Twój ticket został zamknięty! Oto podsumowanie:', 
            embeds: [embed] 
        }).catch(() => {
            // User ma wyłączone DM - ignore
        });
    } catch (err) {
        console.error('❌ Błąd wysyłania PM:', err);
    }
}

// ========== STATYSTYKI rozszerzone ==========
function getTicketStats(guildId) {
    const stmt = db.prepare(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
            SUM(CASE WHEN status = 'claimed' THEN 1 ELSE 0 END) as claimed,
            SUM(CASE WHEN status = 'waiting_for_user' THEN 1 ELSE 0 END) as waiting,
            SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
            AVG(rating) as avg_rating,
            AVG(COALESCE(rating, 0)) as avg_rating_all
        FROM tickets WHERE guild_id = ?
    `);
    return stmt.get(guildId);
}

function getTopSupporters(guildId, limit = 5) {
    const stmt = db.prepare(`
        SELECT claimed_by, COUNT(*) as count, AVG(rating) as avg_rating
        FROM tickets 
        WHERE guild_id = ? AND status = 'closed' AND claimed_by IS NOT NULL
        GROUP BY claimed_by 
        ORDER BY count DESC 
        LIMIT ?
    `);
    return stmt.all(guildId, limit);
}

// ========== CLEANUP ==========
function cleanupOldTickets(days = 30) {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const stmt = db.prepare('DELETE FROM tickets WHERE created_at < ? AND status = "closed"');
    const result = stmt.run(cutoff);
    return result.changes; // liczba usuniętych
}

// Eksport funkcji do użycia w innych modułach
export { 
    startEscalationTimer, 
    sendEscalationAlert,
    checkUserCooldown, 
    setUserCooldown,
    addTicketTag,
    removeTicketTag,
    getTicketTags,
    sendTicketClosedPM,
    getTicketStats,
    getTopSupporters,
    cleanupOldTickets,
    QUICK_RESPONSES
};
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

// ========== KOMENDY TEKSTOWE - TAGI ==========
async function addTagCommand(message, ticketId, tag) {
    if (!message.guild) return;
    
    const ticket = getTicketById(ticketId);
    if (!ticket) {
        return message.reply('❌ Ticket nie znaleziony!');
    }
    
    const supportRole = await message.guild.roles.fetch(SUPPORT_ROLE_ID).catch(() => null);
    if (!supportRole || !message.member.roles.cache.has(supportRole.id)) {
        return message.reply('❌ Tylko support może dodawać tagi!');
    }
    
    if (addTicketTag(ticketId, tag.toLowerCase())) {
        const embed = new EmbedBuilder()
            .setTitle('🏷️ Tag dodany')
            .setColor(0x5865F2)
            .setDescription(`Dodano tag \`${tag}\` do ticketu #${ticketId}`)
            .addFields(
                { name: '👤 Dodał', value: `<@${message.author.id}>`, inline: true },
                { name: '📅 Czas', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: 'Tag Added • BotNexus' })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
        
        // Log
        if (TICKET_LOG_CHANNEL_ID) {
            const logChannel = message.guild.channels.cache.get(TICKET_LOG_CHANNEL_ID);
            logChannel?.send({ embeds: [embed] }).catch(() => {});
        }
    } else {
        return message.reply('⚠️ Ten tag już istnieje w tym tickecie!');
    }
}

async function removeTagCommand(message, ticketId, tag) {
    if (!message.guild) return;
    
    const ticket = getTicketById(ticketId);
    if (!ticket) {
        return message.reply('❌ Ticket nie znaleziony!');
    }
    
    const supportRole = await message.guild.roles.fetch(SUPPORT_ROLE_ID).catch(() => null);
    if (!supportRole || !message.member.roles.cache.has(supportRole.id)) {
        return message.reply('❌ Tylko support może usuwać tagi!');
    }
    
    if (removeTicketTag(ticketId, tag.toLowerCase())) {
        const embed = new EmbedBuilder()
            .setTitle('🏷️ Tag usunięty')
            .setColor(0xED4245)
            .setDescription(`Usunięto tag \`${tag}\` z ticketu #${ticketId}`)
            .addFields(
                { name: '👤 Usunął', value: `<@${message.author.id}>`, inline: true },
                { name: '📅 Czas', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: 'Tag Removed • BotNexus' })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
        
        // Log
        if (TICKET_LOG_CHANNEL_ID) {
            const logChannel = message.guild.channels.cache.get(TICKET_LOG_CHANNEL_ID);
            logChannel?.send({ embeds: [embed] }).catch(() => {});
        }
    } else {
        return message.reply('⚠️ Ten tag nie istnieje w tym tickecie!');
    }
}

// ========== KOMENDY TEKSTOWE - QUICK RESPONSES ==========
async function sendQuickResponseCommand(message, responseId) {
    if (!message.guild) return;
    
    const supportRole = await message.guild.roles.fetch(SUPPORT_ROLE_ID).catch(() => null);
    if (!supportRole || !message.member.roles.cache.has(supportRole.id)) {
        return message.reply('❌ Tylko support może używać Quick Responses!');
    }
    
    // Sprawdź czy to komenda w kanałach ticketów (opcjonalnie)
    const channel = message.channel;
    const ticket = getTicketByChannel(channel.id);
    
    if (!ticket) {
        return message.reply('❌ Ta komenda działa tylko w kanałach ticketów!');
    }
    
    const response = QUICK_RESPONSES.find(r => r.id === responseId);
    if (!response) {
        return message.reply('❌ Nieprawidłowa odpowiedź! Dostępne: ' + QUICK_RESPONSES.map(r => r.id).join(', '));
    }
    
    await channel.send({
        content: response.text,
        embeds: [new EmbedBuilder()
            .setTitle(response.label)
            .setColor(0x5865F2)
            .setFooter({ text: `Quick Response • ${message.author.tag}` })
            .setTimestamp()
        ]
    });
    
    return message.reply(`✅ Wysłano: "${response.label}"`);
}

// ========== KOMENDY TEKSTOWE - TRANSFER KATEGORII ==========
async function transferTicketCategory(message, ticketId, newCategory) {
    if (!message.guild) return;
    
    const ticket = getTicketById(ticketId);
    if (!ticket) {
        return message.reply('❌ Ticket nie znaleziony!');
    }
    
    // Sprawdź uprawnienia
    const supportRole = await message.guild.roles.fetch(SUPPORT_ROLE_ID).catch(() => null);
    if (!supportRole || !message.member.roles.cache.has(supportRole.id)) {
        return message.reply('❌ Tylko support może zmieniać kategorie!');
    }
    
    if (!ticketCategories[newCategory]) {
        return message.reply('❌ Nieprawidłowa kategoria! Dostępne: ' + Object.keys(ticketCategories).join(', '));
    }
    
    const oldCategory = ticket.category;
    
    // Aktualizuj bazę
    const stmt = db.prepare('UPDATE tickets SET category = ? WHERE id = ?');
    stmt.run(newCategory, ticketId);
    
    // Znajdź kanał i zaktualizuj embed
    const channel = await message.guild.channels.fetch(ticket.channel_id).catch(() => null);
    if (channel) {
        const embed = new EmbedBuilder()
            .setTitle('🔄 Kategoria ticketu zmieniona')
            .setColor(ticketCategories[newCategory].color)
            .setDescription(`Ticket #${ticketId} przeniesiony do kategorii **${ticketCategories[newCategory].name}**`)
            .addFields(
                { name: '👤 Zmienił', value: `<@${message.author.id}>`, inline: true },
                { name: '📂 Stara kategoria', value: ticketCategories[oldCategory].name, inline: true },
                { name: '📂 Nowa kategoria', value: ticketCategories[newCategory].name, inline: true }
            )
            .setFooter({ text: 'Category Transfer • BotNexus' })
            .setTimestamp();
        
        await channel.send({ embeds: [embed] });
    }
    
    // Log
    if (TICKET_LOG_CHANNEL_ID) {
        const logChannel = message.guild.channels.cache.get(TICKET_LOG_CHANNEL_ID);
        if (logChannel) {
            logChannel.send({ embeds: [embed] }).catch(() => {});
        }
    }
    
    return message.reply(`✅ Kategoria ticketu #${ticketId} zmieniona na ${ticketCategories[newCategory].name}`);
}

// ========== KOMENDY TEKSTOWE - EXPORT ==========
async function exportTicketsCommand(message) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply('❌ Tylko administratorzy mogą eksportować ticketów!');
    }
    
    if (!message.guild) return;
    
    const csvBuffer = exportTicketsToCSV(message.guild.id);
    if (!csvBuffer) {
        return message.reply('❌ Brak ticketów do eksportu!');
    }
    
    await message.reply({
        content: '📊 Eksport wszystkich ticketów (CSV):',
        files: [{
            attachment: csvBuffer,
            name: `tickets-export-${message.guild.id}-${Date.now()}.csv`
        }]
    });
}

// ========== KOMENDY TEKSTOWE - COOLDOWN ==========
async function checkUserCooldownCommand(message, userId) {
    const cooldown = checkUserCooldown(userId);
    if (cooldown.allowed) {
        return message.reply('✅ Możesz utworzyć nowy ticket. Brak aktywnych cooldownów.');
    } else {
        return message.reply(`⏳ Musisz poczekać jeszcze **${cooldown.remaining} minut** przed utworzeniem nowego ticketu.`);
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