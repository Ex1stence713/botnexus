import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, Colors } from 'discord.js';

const TICKET_CATEGORY_ID = '1487725516810354718';
const SUPPORT_ROLE_ID = '1463651990331457546';

const ticketCategories = {
    'support': { name: '📞 Support', color: 0x3498DB, description: 'Ogólne problemy i pytania' },
    'bug': { name: '🐛 Zgłoszenie błędu', color: 0xE74C3C, description: 'Błędy i problemy techniczne' },
    'suggestion': { name: '💡 Sugestia', color: 0x9B59B6, description: 'Propozycje i pomysły' },
    'report': { name: '⚠️ Zgłoszenie', color: 0xE67E22, description: 'Zgłoszenie użytkownika lub treści' },
    'partnership': { name: '🤝 Partnerstwo', color: 0xF1C40F, description: 'Pytania o współpracę' }
};

const userTickets = new Map();

export async function execute(message, args) {
    if (args.length === 0) {
        return showTicketPanel(message);
    }

    if (args[0] === 'panel') {
        return showTicketPanel(message);
    }

    if (args[0] === 'close' && args[1]) {
        return closeTicket(message, args[1]);
    }

    if (args[0] === 'list') {
        return listTickets(message);
    }

    return message.reply('Dostępne komendy ticket:\n- !ticket - panel wyboru\n- !ticket list - lista twoich ticketów\n- !ticket close <id> - zamknij ticket');
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
    const category = interaction.customId.replace('ticket_', '');
    const categoryData = ticketCategories[category];

    if (!categoryData) return;

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

    const logChannel = guild.channels.cache.find(ch => ch.name === 'ticket-log');
    if (logChannel) {
        logChannel.send({ embeds: [logEmbed] });
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