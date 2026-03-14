import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const automodFile = path.join(__dirname, '../../data/automod.json');

function loadAutomod() {
    try {
        if (fs.existsSync(automodFile)) {
            return JSON.parse(fs.readFileSync(automodFile, 'utf8'));
        }
    } catch (err) {}
    return { 
        enabled: true, 
        badWords: [], 
        antiInvite: true,
        deleteBadMessage: true,
        deleteInviteMessage: true,
        ignoredChannels: [],
        ignoredRoles: []
    };
}

function saveAutomod(config) {
    fs.writeFileSync(automodFile, JSON.stringify(config, null, 2));
}

export const data = new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Zarządzanie automatyczną moderacją')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(sub => sub
        .setName('status')
        .setDescription('Pokaż status automoderacji'))
    .addSubcommand(sub => sub
        .setName('wlacz')
        .setDescription('Włącz automoderację'))
    .addSubcommand(sub => sub
        .setName('wylacz')
        .setDescription('Wyłącz automoderację'))
    .addSubcommand(sub => sub
        .setName('antiinvite')
        .setDescription('Włącz/wyłącz blokowanie zaproszeń')
        .addBooleanOption(opt => opt.setName('wlacz').setDescription('Włącz lub wyłącz').setRequired(true)))
    .addSubcommand(sub => sub
        .setName('addbadword')
        .setDescription('Dodaj złe słowo do filtra')
        .addStringOption(opt => opt.setName('slowo').setDescription('Słowo do zablokowania').setRequired(true)))
    .addSubcommand(sub => sub
        .setName('removebadword')
        .setDescription('Usuń złe słowo z filtra')
        .addStringOption(opt => opt.setName('slowo').setDescription('Słowo do usunięcia').setRequired(true)))
    .addSubcommand(sub => sub
        .setName('badwords')
        .setDescription('Pokaż listę złych słów'))
    .addSubcommand(sub => sub
        .setName('ignorechannel')
        .setDescription('Dodaj/usuń kanał z ignorowanych')
        .addChannelOption(opt => opt.setName('kanal').setDescription('Kanał').setRequired(true))
        .addBooleanOption(opt => opt.setName('dodaj').setDescription('Dodać czy usunąć?').setRequired(true)))
    .addSubcommand(sub => sub
        .setName('ignorerole')
        .setDescription('Dodaj/usuń rolę z ignorowanych')
        .addRoleOption(opt => opt.setName('rola').setDescription('Rola').setRequired(true))
        .addBooleanOption(opt => opt.setName('dodaj').setDescription('Dodać czy usunąć?').setRequired(true)));

export async function execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const automod = loadAutomod();
    
    const embed = new EmbedBuilder().setTimestamp();
    
    switch(sub) {
        case 'status':
            embed.setTitle('⚙️ Status Automoderacji')
                .setColor('#5865F2')
                .addFields(
                    { name: 'Włączona', value: automod.enabled ? '✅ Tak' : '❌ Nie', inline: true },
                    { name: 'Anti-Invite', value: automod.antiInvite ? '✅ Włączony' : '❌ Wyłączony', inline: true },
                    { name: 'Złe słowa', value: automod.badWords?.length > 0 ? `${automod.badWords.length} słów` : 'Brak', inline: true },
                    { name: 'Ignorowane kanały', value: automod.ignoredChannels?.length > 0 ? `${automod.ignoredChannels.length}` : 'Brak', inline: true },
                    { name: 'Ignorowane role', value: automod.ignoredRoles?.length > 0 ? `${automod.ignoredRoles.length}` : 'Brak', inline: true }
                );
            await interaction.reply({ embeds: [embed], ephemeral: true });
            break;
            
        case 'wlacz':
            automod.enabled = true;
            saveAutomod(automod);
            embed.setTitle('✅ Automoderacja włączona').setColor('#2ecc71');
            await interaction.reply({ embeds: [embed], ephemeral: true });
            break;
            
        case 'wylacz':
            automod.enabled = false;
            saveAutomod(automod);
            embed.setTitle('❌ Automoderacja wyłączona').setColor('#e74c3c');
            await interaction.reply({ embeds: [embed], ephemeral: true });
            break;
            
        case 'antiinvite':
            const enableInvite = interaction.options.getBoolean('wlacz');
            automod.antiInvite = enableInvite;
            saveAutomod(automod);
            embed.setTitle(enableInvite ? '✅ Anti-Invite włączone' : '❌ Anti-Invite wyłączone')
                .setColor(enableInvite ? '#2ecc71' : '#e74c3c');
            await interaction.reply({ embeds: [embed], ephemeral: true });
            break;
            
        case 'addbadword':
            const badWord = interaction.options.getString('slowo').toLowerCase();
            if (!automod.badWords) automod.badWords = [];
            if (!automod.badWords.includes(badWord)) {
                automod.badWords.push(badWord);
                saveAutomod(automod);
                embed.setTitle('✅ Dodano złe słowo').setDescription(`Dodano: \`${badWord}\``).setColor('#2ecc71');
            } else {
                embed.setTitle('⚠️ Słowo już istnieje').setDescription(`\`${badWord}\` jest już na liście`).setColor('#f1c40f');
            }
            await interaction.reply({ embeds: [embed], ephemeral: true });
            break;
            
        case 'removebadword':
            const removeWord = interaction.options.getString('slowo').toLowerCase();
            if (!automod.badWords) automod.badWords = [];
            const idx = automod.badWords.indexOf(removeWord);
            if (idx > -1) {
                automod.badWords.splice(idx, 1);
                saveAutomod(automod);
                embed.setTitle('✅ Usunięto złe słowo').setDescription(`Usunięto: \`${removeWord}\``).setColor('#2ecc71');
            } else {
                embed.setTitle('⚠️ Słowo nie istnieje').setDescription(`\`${removeWord}\` nie jest na liście`).setColor('#f1c40f');
            }
            await interaction.reply({ embeds: [embed], ephemeral: true });
            break;
            
        case 'badwords':
            const words = automod.badWords || [];
            embed.setTitle('📝 Lista złych słów')
                .setColor('#5865F2')
                .setDescription(words.length > 0 ? words.map(w => `• \`${w}\``).join('\n') : 'Lista jest pusta');
            await interaction.reply({ embeds: [embed], ephemeral: true });
            break;
            
        case 'ignorechannel':
            const channel = interaction.options.getChannel('kanal');
            const addChannel = interaction.options.getBoolean('dodaj');
            if (!automod.ignoredChannels) automod.ignoredChannels = [];
            
            if (addChannel) {
                if (!automod.ignoredChannels.includes(channel.id)) {
                    automod.ignoredChannels.push(channel.id);
                    saveAutomod(automod);
                    embed.setTitle('✅ Dodano kanał do ignorowanych').setDescription(`<#${channel.id}> teraz jest ignorowany`).setColor('#2ecc71');
                } else {
                    embed.setTitle('⚠️ Kanał już ignorowany').setColor('#f1c40f');
                }
            } else {
                const cIdx = automod.ignoredChannels.indexOf(channel.id);
                if (cIdx > -1) {
                    automod.ignoredChannels.splice(cIdx, 1);
                    saveAutomod(automod);
                    embed.setTitle('✅ Usunięto kanał z ignorowanych').setDescription(`<#${channel.id}> nie jest już ignorowany`).setColor('#2ecc71');
                } else {
                    embed.setTitle('⚠️ Kanał nie był ignorowany').setColor('#f1c40f');
                }
            }
            await interaction.reply({ embeds: [embed], ephemeral: true });
            break;
            
        case 'ignorerole':
            const role = interaction.options.getRole('rola');
            const addRole = interaction.options.getBoolean('dodaj');
            if (!automod.ignoredRoles) automod.ignoredRoles = [];
            
            if (addRole) {
                if (!automod.ignoredRoles.includes(role.id)) {
                    automod.ignoredRoles.push(role.id);
                    saveAutomod(automod);
                    embed.setTitle('✅ Dodano rolę do ignorowanych').setDescription(`${role} teraz jest ignorowana`).setColor('#2ecc71');
                } else {
                    embed.setTitle('⚠️ Rola już ignorowana').setColor('#f1c40f');
                }
            } else {
                const rIdx = automod.ignoredRoles.indexOf(role.id);
                if (rIdx > -1) {
                    automod.ignoredRoles.splice(rIdx, 1);
                    saveAutomod(automod);
                    embed.setTitle('✅ Usunięto rolę z ignorowanych').setDescription(`${role} nie jest już ignorowana`).setColor('#2ecc71');
                } else {
                    embed.setTitle('⚠️ Rola nie była ignorowana').setColor('#f1c40f');
                }
            }
            await interaction.reply({ embeds: [embed], ephemeral: true });
            break;
    }
}
