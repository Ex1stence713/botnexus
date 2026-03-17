import { EmbedBuilder } from 'discord.js';
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

export const name = 'automod';
export const description = 'Zarządzanie automatyczną moderacją';

export async function execute(message, args) {
    if (!message.member?.permissions.has('ManageMessages')) {
        return message.reply('Nie masz uprawnień do zarządzania wiadomościami!');
    }
    
    if (args.length === 0) {
        return message.reply('Podaj akcję! Użycie: !automod <status|wlacz|wylacz|antiinvite|addbadword|removebadword|badwords|ignorechannel|ignorerole>');
    }
    
    const sub = args[0].toLowerCase();
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
            await message.reply({ embeds: [embed] });
            break;
            
        case 'wlacz':
        case 'enable':
            automod.enabled = true;
            saveAutomod(automod);
            embed.setTitle('✅ Automoderacja włączona').setColor('#2ecc71');
            await message.reply({ embeds: [embed] });
            break;
            
        case 'wylacz':
        case 'disable':
            automod.enabled = false;
            saveAutomod(automod);
            embed.setTitle('❌ Automoderacja wyłączona').setColor('#e74c3c');
            await message.reply({ embeds: [embed] });
            break;
            
        case 'antiinvite':
            const enableInvite = args[1]?.toLowerCase() === 'on' || args[1]?.toLowerCase() === 'wlacz' || args[1]?.toLowerCase() === 'true';
            automod.antiInvite = enableInvite;
            saveAutomod(automod);
            embed.setTitle(enableInvite ? '✅ Anti-Invite włączone' : '❌ Anti-Invite wyłączone')
                .setColor(enableInvite ? '#2ecc71' : '#e74c3c');
            await message.reply({ embeds: [embed] });
            break;
            
        case 'addbadword':
            const badWord = args.slice(1).join(' ').toLowerCase();
            if (!badWord) {
                return message.reply('Podaj słowo! Użycie: !automod addbadword <słowo>');
            }
            if (!automod.badWords) automod.badWords = [];
            if (!automod.badWords.includes(badWord)) {
                automod.badWords.push(badWord);
                saveAutomod(automod);
                embed.setTitle('✅ Dodano złe słowo').setDescription(`Dodano: \`${badWord}\``).setColor('#2ecc71');
            } else {
                embed.setTitle('⚠️ Słowo już istnieje').setDescription(`\`${badWord}\` jest już na liście`).setColor('#f1c40f');
            }
            await message.reply({ embeds: [embed] });
            break;
            
        case 'removebadword':
            const removeWord = args.slice(1).join(' ').toLowerCase();
            if (!removeWord) {
                return message.reply('Podaj słowo! Użycie: !automod removebadword <słowo>');
            }
            if (!automod.badWords) automod.badWords = [];
            const idx = automod.badWords.indexOf(removeWord);
            if (idx > -1) {
                automod.badWords.splice(idx, 1);
                saveAutomod(automod);
                embed.setTitle('✅ Usunięto złe słowo').setDescription(`Usunięto: \`${removeWord}\``).setColor('#2ecc71');
            } else {
                embed.setTitle('⚠️ Słowo nie istnieje').setDescription(`\`${removeWord}\` nie jest na liście`).setColor('#f1c40f');
            }
            await message.reply({ embeds: [embed] });
            break;
            
        case 'badwords':
            const words = automod.badWords || [];
            embed.setTitle('📝 Lista złych słów')
                .setColor('#5865F2')
                .setDescription(words.length > 0 ? words.map(w => `• \`${w}\``).join('\n') : 'Lista jest pusta');
            await message.reply({ embeds: [embed] });
            break;
            
        case 'ignorechannel':
            if (args.length < 2) {
                return message.reply('Podaj kanał! Użycie: !automod ignorechannel <#kanał>');
            }
            const channelId = args[1].replace(/<#|>/g, '');
            if (!automod.ignoredChannels) automod.ignoredChannels = [];
            
            if (!automod.ignoredChannels.includes(channelId)) {
                automod.ignoredChannels.push(channelId);
                saveAutomod(automod);
                embed.setTitle('✅ Dodano kanał do ignorowanych').setDescription(`<#${channelId}> teraz jest ignorowany`).setColor('#2ecc71');
            } else {
                embed.setTitle('⚠️ Kanał już ignorowany').setColor('#f1c40f');
            }
            await message.reply({ embeds: [embed] });
            break;
            
        case 'ignorerole':
            if (args.length < 2) {
                return message.reply('Podaj rolę! Użycie: !automod ignorerole <@rola>');
            }
            const roleId = args[1].replace(/<@&|>/g, '');
            if (!automod.ignoredRoles) automod.ignoredRoles = [];
            
            if (!automod.ignoredRoles.includes(roleId)) {
                automod.ignoredRoles.push(roleId);
                saveAutomod(automod);
                embed.setTitle('✅ Dodano rolę do ignorowanych').setDescription(`<@&${roleId}> teraz jest ignorowana`).setColor('#2ecc71');
            } else {
                embed.setTitle('⚠️ Rola już ignorowana').setColor('#f1c40f');
            }
            await message.reply({ embeds: [embed] });
            break;
            
        default:
            await message.reply('Nieznana akcja! Dostępne: status, wlacz, wylacz, antiinvite, addbadword, removebadword, badwords, ignorechannel, ignorerole');
    }
}
