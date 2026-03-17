import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } from 'discord.js';

export const name = 'autokanal';
export const description = 'Zarządzanie autokanałami głosowymi';

const voiceChannels = new Map();
let controlChannelId = null;
let controlMessageId = null;
let autoVoiceChannelId = null; // ID kanału głosowego "autokanał"

export async function execute(message, args) {
    if (!message.guild) return message.reply('Ta komenda działa tylko na serwerze!');
    
    const subcommand = args[0]?.toLowerCase();
    
    if (!subcommand || subcommand === 'help') {
        return showHelp(message);
    }
    
    if (subcommand === 'ustaw') {
        return setupControlChannel(message, args[1]);
    }
    
    if (subcommand === 'tworz') {
        return createVoiceChannel(message, args.slice(1));
    }
    
    if (subcommand === 'zamknij') {
        return closeVoiceChannel(message);
    }
    
    if (subcommand === 'nazwa') {
        return changeVoiceName(message, args.slice(1));
    }
    
    if (subcommand === 'limit') {
        return changeVoiceLimit(message, args[1]);
    }
    
    if (subcommand === 'kick') {
        return kickFromVoice(message, args[1]);
    }
    
    if (subcommand === 'panel') {
        return showControlPanel(message);
    }
    
    if (subcommand === 'ustawautokanal') {
        return setupAutoVoiceChannel(message, args[1]);
    }
    
    if (subcommand === 'blokuj') {
        return blockUserFromChannel(message, args[1]);
    }
    
    if (subcommand === 'odblokuj') {
        return unblockUserFromChannel(message, args[1]);
    }
    
    return showHelp(message);
}

async function showHelp(message) {
    const embed = new EmbedBuilder()
        .setTitle('🎤 Autokanał - Pomoc')
        .setColor(0x5865F2)
        .setDescription('Zarządzaj kanałami głosowymi!')
        .addFields(
            { name: '⚙️ !autokanal ustaw <#kanał>', value: 'Ustawia kanał sterowania', inline: false },
            { name: '🎤 !autokanal ustawautokanal <#kanał>', value: 'Ustawia kanał głosowy autokanału', inline: false },
            { name: '📥 !autokanal tworz [nazwa]', value: 'Tworzy twój kanał głosowy', inline: false },
            { name: '🔒 !autokanal zamknij', value: 'Zamyka twój kanał głosowy', inline: false },
            { name: '✏️ !autokanal nazwa <tekst>', value: 'Zmienia nazwę twojego kanału', inline: false },
            { name: '👥 !autokanal limit <1-99>', value: 'Ustawia limit użytkowników', inline: false },
            { name: '👢 !autokanal kick <@użytkownik>', value: 'Wyrzuca użytkownika z kanału', inline: false },
            { name: '🚫 !autokanal blokuj <@użytkownik>', value: 'Blokuje użytkownika na kanale', inline: false },
            { name: '✅ !autokanal odblokuj <@użytkownik>', value: 'Odblokowuje użytkownika na kanale', inline: false },
            { name: '🎛️ !autokanal panel', value: 'Pokazuje panel sterowania', inline: false }
        )
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
}

async function setupControlChannel(message, channelArg) {
    if (!channelArg) {
        return message.reply('Podaj ID lub taguj kanał! `!autokanal ustaw #kanał`');
    }
    
    const channelId = channelArg.replace(/<#/, '').replace(/>/g, '');
    const channel = message.guild.channels.cache.get(channelId);
    
    if (!channel || channel.type !== ChannelType.GuildText) {
        return message.reply('Podaj poprawny kanał tekstowy!');
    }
    
    controlChannelId = channelId;
    
    await message.reply(`✅ Ustawiono kanał sterowania na: ${channel}`);
    
    await showControlPanel(message);
}

async function setupAutoVoiceChannel(message, channelArg) {
    if (!channelArg) {
        return message.reply('Podaj ID lub taguj kanał głosowy! `!autokanal ustawautokanal #kanał`');
    }
    
    const channelId = channelArg.replace(/<#/, '').replace(/>/g, '');
    const channel = message.guild.channels.cache.get(channelId);
    
    if (!channel || channel.type !== ChannelType.GuildVoice) {
        return message.reply('Podaj poprawny kanał głosowy!');
    }
    
    autoVoiceChannelId = channelId;
    
    await message.reply(`✅ Ustawiono kanał autokanału na: ${channel}`);
    
    // Wyślij informację o panelu
    await sendAdvancedControlPanel(message, channel);
}

async function sendAdvancedControlPanel(message, voiceChannel) {
    const embed = new EmbedBuilder()
        .setTitle('🎛️ Panel Autokanału')
        .setColor(0x5865F2)
        .setDescription(`Kanał głosowy: ${voiceChannel}`)
        .addFields(
            { name: '📥 Dołącz', value: 'Dołącz na ten kanał, aby utworzyć własny kanał głosowy', inline: false },
            { name: '⚙️ Zarządzanie', value: 'Użyj przycisków poniżej aby zarządzać swoim kanałem', inline: false }
        )
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('voice_create_auto')
                .setLabel('📥 Utwórz mój kanał')
                .setStyle(ButtonStyle.Success)
        );

    if (controlChannelId) {
        const channel = message.guild.channels.cache.get(controlChannelId);
        if (channel) {
            await channel.send({ embeds: [embed], components: [row] });
            return message.reply('✅ Panel autokanału został wysłany na kanale sterowania!');
        }
    }

    await message.reply({ embeds: [embed], components: [row] });
}

async function showControlPanel(message) {
    const embed = new EmbedBuilder()
        .setTitle('🎛️ Panel Autokanałów')
        .setColor(0x5865F2)
        .setDescription('Zarządzaj swoim kanałem głosowym!')
        .addFields(
            { name: '📥 Utwórz kanał', value: 'Kliknij poniżej aby utworzyć własny kanał głosowy', inline: false }
        )
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('voice_create')
                .setLabel('🎤 Utwórz mój kanał')
                .setStyle(ButtonStyle.Success)
        );

    if (controlChannelId) {
        const channel = message.guild.channels.cache.get(controlChannelId);
        if (channel) {
            await channel.send({ embeds: [embed], components: [row] });
            return message.reply('✅ Panel został wysłany na kanale sterowania!');
        }
    }

    await message.reply({ embeds: [embed], components: [row] });
}

async function createVoiceChannel(message, args) {
    const user = message.author;
    const guild = message.guild;
    
    if (voiceChannels.has(user.id)) {
        return message.reply('Masz już aktywny kanał głosowy! Użyj `!autokanal zamknij` aby go zamknąć.');
    }
    
    const channelName = args.length > 0 ? args.join(' ') : `🔊 │ ${user.username}`;
    
    const category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name.includes('Voice'));
    
    const voiceChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildVoice,
        parent: category?.id,
        permissionOverwrites: [
            {
                id: guild.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
            },
            {
                id: user.id,
                allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers, PermissionFlagsBits.MoveMembers],
            }
        ]
    });
    
    voiceChannels.set(user.id, { 
        ownerId: user.id, 
        channel: voiceChannel,
        channelName: channelName
    });
    
    // Przenieś użytkownika na nowy kanał jeśli jest na innym kanale głosowym
    if (message.member.voice.channel) {
        await message.member.voice.setChannel(voiceChannel);
    }
    
    const embed = new EmbedBuilder()
        .setTitle('🎤 Utworzono kanał głosowy!')
        .setColor(0x2ecc71)
        .setDescription(`Twój kanał został utworzony!`)
        .addFields(
            { name: '📛 Nazwa', value: channelName, inline: true },
            { name: '🆔 ID', value: voiceChannel.id, inline: true }
        )
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('voice_rename')
                .setLabel('✏️ Zmień nazwę')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('voice_limit')
                .setLabel('👥 Limit')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('voice_close')
                .setLabel('🔒 Zamknij')
                .setStyle(ButtonStyle.Danger)
        );

    const reply = await message.reply({ embeds: [embed], components: [row] });
    
    // Dodaj dodatkowe info
    const infoEmbed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setDescription(`📢 Na kanale ${controlChannelId ? `<#${controlChannelId}>` : 'tym kanale'} pojawi się panel sterowania!`);

    await message.channel.send({ embeds: [infoEmbed] });
    
    // Wyślij panel na kanale sterowania
    if (controlChannelId) {
        const controlChannel = guild.channels.cache.get(controlChannelId);
        if (controlChannel) {
            const panelEmbed = new EmbedBuilder()
                .setTitle('🎛️ Twój kanał')
                .setColor(0x2ecc71)
                .setDescription(`**${channelName}** - ${voiceChannel}`)
                .addFields(
                    { name: '👤 Właściciel', value: user.tag, inline: true },
                    { name: '👥 Użytkownicy', value: '0', inline: true }
                );

            const panelRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('voice_rename_' + user.id)
                        .setLabel('✏️ Nazwa')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('voice_limit_' + user.id)
                        .setLabel('👥 Limit')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('voice_kick_' + user.id)
                        .setLabel('👢 Kick')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('voice_close_' + user.id)
                        .setLabel('🔒 Zamknij')
                        .setStyle(ButtonStyle.Danger)
                );

            await controlChannel.send({ 
                content: user.toString(),
                embeds: [panelEmbed], 
                components: [panelRow] 
            });
        }
    }
}

async function closeVoiceChannel(message) {
    const user = message.author;
    
    const channelData = voiceChannels.get(user.id);
    if (!channelData) {
        return message.reply('Nie masz aktywnego kanału głosowego!');
    }
    
    const channel = channelData.channel;
    if (channel) {
        await channel.delete('Zamknięto przez właściciela');
    }
    
    voiceChannels.delete(user.id);
    
    await message.reply('Twój kanał głosowy został zamknięty!');
}

async function changeVoiceName(message, args) {
    const user = message.author;
    
    const channelData = voiceChannels.get(user.id);
    if (!channelData) {
        return message.reply('Nie masz aktywnego kanału głosowego!');
    }
    
    if (args.length === 0) {
        return message.reply('Podaj nazwę kanału! `!autokanal nazwa <tekst>`');
    }
    
    const newName = args.join(' ');
    const channel = channelData.channel;
    
    if (channel) {
        await channel.setName(newName);
        channelData.channelName = newName;
        await message.reply(`Nazwa kanału została zmieniona na: **${newName}**`);
    }
}

async function changeVoiceLimit(message, args) {
    const user = message.author;
    
    const channelData = voiceChannels.get(user.id);
    if (!channelData) {
        return message.reply('Nie masz aktywnego kanału głosowego!');
    }
    
    const limit = parseInt(args[0]);
    if (!limit || limit < 1 || limit > 99) {
        return message.reply('Podaj limit 1-99! `!autokanal limit <1-99>`');
    }
    
    const channel = channelData.channel;
    
    if (channel) {
        await channel.setUserLimit(limit);
        await message.reply(`Limit użytkowników został ustawiony na: **${limit}**`);
    }
}

async function kickFromVoice(message, args) {
    const user = message.author;
    
    const channelData = voiceChannels.get(user.id);
    if (!channelData) {
        return message.reply('Nie masz aktywnego kanału głosowego!');
    }
    
    if (args.length === 0) {
        return message.reply('Podaj użytkownika! `!autokanal kick <@użytkownik>`');
    }
    
    const userId = args[0].replace(/<@!/g, '').replace(/<@/g, '').replace(/>/g, '');
    const member = await message.guild.members.fetch(userId).catch(() => null);
    
    if (!member) {
        return message.reply('Nie znaleziono użytkownika!');
    }
    
    const channel = channelData.channel;
    
    if (channel && member.voice.channelId === channel.id) {
        await member.voice.disconnect('Wyrzucony przez właściciela kanału');
        await message.reply(`Wyrzuciłem ${member.user.tag} z kanału!`);
    } else {
        await message.reply('Ten użytkownik nie jest na twoim kanale!');
    }
}

async function blockUserFromChannel(message, args) {
    const user = message.author;
    
    const channelData = voiceChannels.get(user.id);
    if (!channelData) {
        return message.reply('Nie masz aktywnego kanału głosowego!');
    }
    
    if (args.length === 0) {
        return message.reply('Podaj użytkownika! `!autokanal blokuj <@użytkownik>`');
    }
    
    const userId = args[0].replace(/<@!/g, '').replace(/<@/g, '').replace(/>/g, '');
    const member = await message.guild.members.fetch(userId).catch(() => null);
    
    if (!member) {
        return message.reply('Nie znaleziono użytkownika!');
    }
    
    const channel = channelData.channel;
    
    if (channel) {
        await channel.permissionOverwrites.create(member.id, {
            Connect: false,
            ViewChannel: false
        });
        await message.reply(`Zablokowałem ${member.user.tag} na twoim kanale!`);
    }
}

async function unblockUserFromChannel(message, args) {
    const user = message.author;
    
    const channelData = voiceChannels.get(user.id);
    if (!channelData) {
        return message.reply('Nie masz aktywnego kanału głosowego!');
    }
    
    if (args.length === 0) {
        return message.reply('Podaj użytkownika! `!autokanal odblokuj <@użytkownik>`');
    }
    
    const userId = args[0].replace(/<@!/g, '').replace(/<@/g, '').replace(/>/g, '');
    const member = await message.guild.members.fetch(userId).catch(() => null);
    
    if (!member) {
        return message.reply('Nie znaleziono użytkownika!');
    }
    
    const channel = channelData.channel;
    
    if (channel) {
        const overwrite = channel.permissionOverwrites.cache.get(member.id);
        if (overwrite) {
            await overwrite.delete();
        }
        await message.reply(`Odblokowałem ${member.user.tag} na twoim kanale!`);
    }
}

export function setupVoiceEvents(client) {
    // voiceStateUpdate - sprawdza czy kanał jest pusty
    client.on('voiceStateUpdate', async (oldState, newState) => {
        // Sprawdź czy ktoś dołączył na kanał autokanału
        if (autoVoiceChannelId && newState.channelId === autoVoiceChannelId) {
            const user = newState.member;
            const guild = newState.guild;
            
            if (user && !voiceChannels.has(user.id)) {
                // Sprawdź czy użytkownik jest już na jakimś kanale głosowym
                if (user.voice.channelId && user.voice.channelId !== autoVoiceChannelId) {
                    // Najpierw wyrzuć z obecnego kanału
                    await user.voice.setChannel(null);
                }
                
                const channelName = `🔊 │ ${user.user.username}`;
                
                const category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name.includes('Voice'));
                
                const voiceChannel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildVoice,
                    parent: category?.id,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
                        },
                        {
                            id: user.id,
                            allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers, PermissionFlagsBits.MoveMembers],
                        }
                    ]
                });
                
                voiceChannels.set(user.id, { 
                    ownerId: user.id, 
                    channel: voiceChannel,
                    channelName: channelName
                });
                
                // Przenieś użytkownika na nowy kanał
                await user.voice.setChannel(voiceChannel);
                
                // Wyślij informację do użytkownika
                try {
                    const embed = new EmbedBuilder()
                        .setTitle('✅ Utworzono twój kanał!')
                        .setColor(0x2ecc71)
                        .setDescription(`Twój kanał głosowy został utworzony: ${voiceChannel}`)
                        .addFields(
                            { name: '📛 Nazwa', value: channelName, inline: true },
                            { name: '🆔 ID', value: voiceChannel.id, inline: true }
                        )
                        .setFooter({ text: 'BotNexus' })
                        .setTimestamp();
                    
                    await user.send({ embeds: [embed] });
                } catch (e) {}
                
                // Wyślij panel zarządzania na kanale sterowania
                if (controlChannelId) {
                    const controlChannel = guild.channels.cache.get(controlChannelId);
                    if (controlChannel) {
                        const panelEmbed = new EmbedBuilder()
                            .setTitle('🎛️ Twój kanał')
                            .setColor(0x2ecc71)
                            .setDescription(`**${channelName}** - ${voiceChannel}`)
                            .addFields(
                                { name: '👤 Właściciel', value: user.user.tag, inline: true },
                                { name: '👥 Użytkownicy', value: '1', inline: true }
                            );

                        const panelRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('voice_rename_' + user.id)
                                    .setLabel('✏️ Nazwa')
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId('voice_limit_' + user.id)
                                    .setLabel('👥 Limit')
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId('voice_kick_' + user.id)
                                    .setLabel('👢 Kick')
                                    .setStyle(ButtonStyle.Secondary),
                                new ButtonBuilder()
                                    .setCustomId('voice_block_' + user.id)
                                    .setLabel('🚫 Blokuj')
                                    .setStyle(ButtonStyle.Secondary),
                                new ButtonBuilder()
                                    .setCustomId('voice_close_' + user.id)
                                    .setLabel('🔒 Zamknij')
                                    .setStyle(ButtonStyle.Danger)
                            );

                        const panelRow2 = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('voice_lock_' + user.id)
                                    .setLabel('🔒 Zablokuj')
                                    .setStyle(ButtonStyle.Danger),
                                new ButtonBuilder()
                                    .setCustomId('voice_unlock_' + user.id)
                                    .setLabel('🔓 Odblokuj')
                                    .setStyle(ButtonStyle.Success),
                                new ButtonBuilder()
                                    .setCustomId('voice_hide_' + user.id)
                                    .setLabel('👁️ Ukryj')
                                    .setStyle(ButtonStyle.Danger),
                                new ButtonBuilder()
                                    .setCustomId('voice_unhide_' + user.id)
                                    .setLabel('👁️ Odkryj')
                                    .setStyle(ButtonStyle.Success),
                                new ButtonBuilder()
                                    .setCustomId('voice_reset_' + user.id)
                                    .setLabel('🔄 Reset')
                                    .setStyle(ButtonStyle.Secondary)
                            );

                        await controlChannel.send({ 
                            content: user.toString(),
                            embeds: [panelEmbed], 
                            components: [panelRow, panelRow2] 
                        });
                    }
                }
            }
            return;
        }
        
        const channelId = oldState.channelId;
        
        if (channelId) {
            const channel = oldState.channel;
            
            if (channel && channel.members.size === 0) {
                // Sprawdź czy to autokanał
                for (const [userId, data] of voiceChannels) {
                    if (data.channel && data.channel.id === channelId) {
                        const owner = await client.users.fetch(userId).catch(() => null);
                        
                        if (owner) {
                            try {
                                const user = await client.users.fetch(owner.id);
                                const dm = await user.createDM();
                                await dm.send('Twój kanał głosowy został usunięty z powodu braku osób!');
                            } catch (e) {}
                        }
                        
                        voiceChannels.delete(userId);
                        await channel.delete('Brak użytkowników');
                        break;
                    }
                }
            }
        }
    });
    
    // Obsługa przycisków
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;
        
        const customId = interaction.customId;
        const user = interaction.user;
        
        // Utwórz kanał
        if (customId === 'voice_create') {
            if (voiceChannels.has(user.id)) {
                return interaction.reply({ content: 'Masz już aktywny kanał!', ephemeral: true });
            }
            
            const guild = interaction.guild;
            const channelName = `🔊 │ ${user.username}`;
            
            const category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name.includes('Voice'));
            
            const voiceChannel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildVoice,
                parent: category?.id,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
                    },
                    {
                        id: user.id,
                        allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers, PermissionFlagsBits.MoveMembers],
                    }
                ]
            });
            
            voiceChannels.set(user.id, { 
                ownerId: user.id, 
                channel: voiceChannel,
                channelName: channelName
            });
            
            // Wyślij użytkownika na kanał
            if (interaction.member.voice.channel) {
                await interaction.member.voice.setChannel(voiceChannel);
            }
            
            const embed = new EmbedBuilder()
                .setTitle('✅ Kanał utworzony!')
                .setColor(0x2ecc71)
                .setDescription(`Twój kanał: ${voiceChannel}`)
                .addFields(
                    { name: '📛 Nazwa', value: channelName, inline: true }
                );

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('voice_rename_btn_' + user.id)
                        .setLabel('✏️ Zmień nazwę')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('voice_limit_btn_' + user.id)
                        .setLabel('👥 Limit')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('voice_close_btn_' + user.id)
                        .setLabel('🔒 Zamknij')
                        .setStyle(ButtonStyle.Danger)
                );

            await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
            return;
        }
        
        // Zamknij kanał (z przycisku)
        if (customId.startsWith('voice_close_') || customId === 'voice_close') {
            const targetUserId = customId.includes('_') ? customId.split('_')[2] : user.id;
            
            if (user.id !== targetUserId) {
                return interaction.reply({ content: 'To nie twój kanał!', ephemeral: true });
            }
            
            const channelData = voiceChannels.get(user.id);
            if (channelData && channelData.channel) {
                await channelData.channel.delete('Zamknięto przez właściciela');
                voiceChannels.delete(user.id);
            }
            
            await interaction.reply({ content: 'Kanał zamknięty!', ephemeral: true });
            return;
        }
        
        // Zmień nazwę (z przycisku)
        if (customId.startsWith('voice_rename_') || customId === 'voice_rename') {
            const targetUserId = customId.includes('_') ? customId.split('_')[2] : user.id;
            
            if (user.id !== targetUserId) {
                return interaction.reply({ content: 'To nie twój kanał!', ephemeral: true });
            }
            
            await interaction.reply({ content: 'Użyj komendy `!autokanal nazwa <nowa nazwa>`', ephemeral: true });
            return;
        }
        
        // Zmień limit (z przycisku)
        if (customId.startsWith('voice_limit_') || customId === 'voice_limit') {
            const targetUserId = customId.includes('_') ? customId.split('_')[2] : user.id;
            
            if (user.id !== targetUserId) {
                return interaction.reply({ content: 'To nie twój kanał!', ephemeral: true });
            }
            
            await interaction.reply({ content: 'Użyj komendy `!autokanal limit <1-99>`', ephemeral: true });
            return;
        }
        
        // Kick (z przycisku)
        if (customId.startsWith('voice_kick_')) {
            const targetUserId = customId.split('_')[2];
            
            if (user.id !== targetUserId) {
                return interaction.reply({ content: 'To nie twój kanał!', ephemeral: true });
            }
            
            await interaction.reply({ content: 'Użyj komendy `!autokanal kick <@użytkownik>`', ephemeral: true });
            return;
        }
        
        // Block (z przycisku)
        if (customId.startsWith('voice_block_')) {
            const targetUserId = customId.split('_')[2];
            
            if (user.id !== targetUserId) {
                return interaction.reply({ content: 'To nie twój kanał!', ephemeral: true });
            }
            
            await interaction.reply({ content: 'Użyj komendy `!autokanal blokuj <@użytkownik>`', ephemeral: true });
            return;
        }
        
        // Lock - zablokuj kanał (z przycisku)
        if (customId.startsWith('voice_lock_')) {
            const targetUserId = customId.split('_')[2];
            
            if (user.id !== targetUserId) {
                return interaction.reply({ content: 'To nie twój kanał!', ephemeral: true });
            }
            
            const channelData = voiceChannels.get(user.id);
            if (channelData && channelData.channel) {
                const channel = channelData.channel;
                await channel.permissionOverwrites.create(channel.guild.id, {
                    Connect: false
                });
                await interaction.reply({ content: '🔒 Kanał został zablokowany!', ephemeral: true });
            }
            return;
        }
        
        // Unlock - odblokuj kanał (z przycisku)
        if (customId.startsWith('voice_unlock_')) {
            const targetUserId = customId.split('_')[2];
            
            if (user.id !== targetUserId) {
                return interaction.reply({ content: 'To nie twój kanał!', ephemeral: true });
            }
            
            const channelData = voiceChannels.get(user.id);
            if (channelData && channelData.channel) {
                const channel = channelData.channel;
                const overwrite = channel.permissionOverwrites.cache.get(channel.guild.id);
                if (overwrite) {
                    await overwrite.delete();
                }
                await channel.permissionOverwrites.create(channel.guild.id, {
                    Connect: true
                });
                await interaction.reply({ content: '🔓 Kanał został odblokowany!', ephemeral: true });
            }
            return;
        }
        
        // Hide - ukryj kanał (z przycisku)
        if (customId.startsWith('voice_hide_')) {
            const targetUserId = customId.split('_')[2];
            
            if (user.id !== targetUserId) {
                return interaction.reply({ content: 'To nie twój kanał!', ephemeral: true });
            }
            
            const channelData = voiceChannels.get(user.id);
            if (channelData && channelData.channel) {
                const channel = channelData.channel;
                await channel.permissionOverwrites.create(channel.guild.id, {
                    ViewChannel: false
                });
                await interaction.reply({ content: '👁️ Kanał został ukryty!', ephemeral: true });
            }
            return;
        }
        
        // Unhide - odkryj kanał (z przycisku)
        if (customId.startsWith('voice_unhide_')) {
            const targetUserId = customId.split('_')[2];
            
            if (user.id !== targetUserId) {
                return interaction.reply({ content: 'To nie twój kanał!', ephemeral: true });
            }
            
            const channelData = voiceChannels.get(user.id);
            if (channelData && channelData.channel) {
                const channel = channelData.channel;
                const overwrite = channel.permissionOverwrites.cache.get(channel.guild.id);
                if (overwrite) {
                    await overwrite.delete();
                }
                await channel.permissionOverwrites.create(channel.guild.id, {
                    ViewChannel: true
                });
                await interaction.reply({ content: '👁️ Kanał został odkryty!', ephemeral: true });
            }
            return;
        }
        
        // Reset - zresetuj uprawnienia (z przycisku)
        if (customId.startsWith('voice_reset_')) {
            const targetUserId = customId.split('_')[2];
            
            if (user.id !== targetUserId) {
                return interaction.reply({ content: 'To nie twój kanał!', ephemeral: true });
            }
            
            const channelData = voiceChannels.get(user.id);
            if (channelData && channelData.channel) {
                const channel = channelData.channel;
                const guild = channel.guild;
                
                // Usuń wszystkie nadpisania uprawnień
                for (const [id, overwrite] of channel.permissionOverwrites.cache) {
                    if (id !== guild.id && id !== user.id) {
                        await overwrite.delete();
                    }
                }
                
                // Przywróć domyślne uprawnienia
                const guildOverwrite = channel.permissionOverwrites.cache.get(guild.id);
                if (guildOverwrite) {
                    await guildOverwrite.delete();
                }
                
                await channel.permissionOverwrites.create(guild.id, {
                    ViewChannel: true,
                    Connect: true
                });
                
                await interaction.reply({ content: '🔄 Ustawienia kanału zostały zresetowane!', ephemeral: true });
            }
            return;
        }
    });
}

export function setControlChannel(channelId) {
    controlChannelId = channelId;
}

export function getControlChannel() {
    return controlChannelId;
}

export function setAutoVoiceChannel(channelId) {
    autoVoiceChannelId = channelId;
}

export function getAutoVoiceChannel() {
    return autoVoiceChannelId;
}
