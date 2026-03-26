import { EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import fs from 'fs/promises';

const VERIFICATION_FILE = 'data/verification.json';

// Ładuj konfigurację weryfikacji
async function loadVerificationConfig() {
    try {
        const data = await fs.readFile(VERIFICATION_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Jeśli plik nie istnieje, zwróć domyślną konfigurację
        return {
            enabled: false,
            verificationRoleId: null,
            verifiedRoleId: null,
            verificationChannelId: null,
            logChannelId: null,
            verificationMessage: "Kliknij przycisk poniżej, aby się zweryfikować!",
            verificationButtonText: "Zweryfikuj się",
            verificationButtonEmoji: "✅",
            autoVerifyOnJoin: false,
            requireCaptcha: false,
            captchaDifficulty: "medium",
            verificationCooldown: 60,
            maxAttempts: 3,
            verifiedUsers: {}
        };
    }
}

// Zapisz konfigurację weryfikacji
async function saveVerificationConfig(config) {
    await fs.writeFile(VERIFICATION_FILE, JSON.stringify(config, null, 2));
}

// Generuj CAPTCHA
function generateCaptcha(difficulty) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let length = 5;
    if (difficulty === 'medium') length = 6;
    if (difficulty === 'hard') length = 8;
    
    let captcha = '';
    for (let i = 0; i < length; i++) {
        captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return captcha;
}

export const name = 'weryfikacja';
export const description = 'Konfiguruje system weryfikacji użytkowników';

export async function execute(message, args) {
    const { guild, member, author, channel } = message;

    // Sprawdź czy komenda jest używana na serwerze
    if (!guild) {
        return message.reply('Ta komenda działa tylko na serwerze!');
    }

    // Sprawdź uprawnienia użytkownika
    if (!member?.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply('Nie masz uprawnień administratora!');
    }

    // Sprawdź uprawnienia bota
    if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return message.reply('Bot nie ma uprawnień do zarządzania rolami!');
    }

    const config = await loadVerificationConfig();

    // Podkomendy
    const subcommand = args[0]?.toLowerCase();

    if (!subcommand) {
        // Wyświetl status weryfikacji
        const statusEmbed = new EmbedBuilder()
            .setTitle('🔐 Status weryfikacji')
            .addFields(
                { name: 'Włączona', value: config.enabled ? '✅ Tak' : '❌ Nie', inline: true },
                { name: 'Rola weryfikacji', value: config.verificationRoleId ? `<@&${config.verificationRoleId}>` : 'Nie ustawiona', inline: true },
                { name: 'Rola zweryfikowanych', value: config.verifiedRoleId ? `<@&${config.verifiedRoleId}>` : 'Nie ustawiona', inline: true },
                { name: 'Kanał weryfikacji', value: config.verificationChannelId ? `<#${config.verificationChannelId}>` : 'Nie ustawiony', inline: true },
                { name: 'Kanał logów', value: config.logChannelId ? `<#${config.logChannelId}>` : 'Nie ustawiony', inline: true },
                { name: 'CAPTCHA', value: config.requireCaptcha ? `✅ Tak (${config.captchaDifficulty})` : '❌ Nie', inline: true },
                { name: 'Auto-weryfikacja', value: config.autoVerifyOnJoin ? '✅ Tak' : '❌ Nie', inline: true },
                { name: 'Cooldown', value: `${config.verificationCooldown}s`, inline: true },
                { name: 'Max prób', value: `${config.maxAttempts}`, inline: true },
                { name: 'Zweryfikowani', value: `${Object.keys(config.verifiedUsers).length} użytkowników`, inline: true }
            )
            .setColor(0x5865F2)
            .setFooter({ text: 'Użyj !weryfikacja <podkomenda> aby skonfigurować' });

        return message.reply({ embeds: [statusEmbed] });
    }

    switch (subcommand) {
        case 'wlacz':
        case 'włącz': {
            if (!config.verificationRoleId || !config.verifiedRoleId) {
                return message.reply('Najpierw ustaw role weryfikacji i zweryfikowanych! Użyj `!weryfikacja rola-weryfikacji <@rola>` i `!weryfikacja rola-zweryfikowanych <@rola>`');
            }
            config.enabled = true;
            await saveVerificationConfig(config);
            
            const embed = new EmbedBuilder()
                .setTitle('✅ Weryfikacja włączona')
                .setDescription('System weryfikacji został włączony!')
                .setColor(0x57F287);
            return message.reply({ embeds: [embed] });
        }

        case 'wylacz':
        case 'wyłącz': {
            config.enabled = false;
            await saveVerificationConfig(config);
            
            const embed = new EmbedBuilder()
                .setTitle('❌ Weryfikacja wyłączona')
                .setDescription('System weryfikacji został wyłączony!')
                .setColor(0xED4245);
            return message.reply({ embeds: [embed] });
        }

        case 'rola-weryfikacji': {
            const roleMention = args[1];
            if (!roleMention) {
                return message.reply('Podaj rolę! Użycie: `!weryfikacja rola-weryfikacji <@rola>`');
            }

            const roleId = roleMention.replace(/<@&/g, '').replace(/>/g, '');
            const role = guild.roles.cache.get(roleId);
            
            if (!role) {
                return message.reply('Nie znaleziono takiej roli!');
            }

            config.verificationRoleId = role.id;
            await saveVerificationConfig(config);

            const embed = new EmbedBuilder()
                .setTitle('✅ Rola weryfikacji ustawiona')
                .setDescription(`Rola weryfikacji: ${role}`)
                .setColor(0x57F287);
            return message.reply({ embeds: [embed] });
        }

        case 'rola-zweryfikowanych': {
            const roleMention = args[1];
            if (!roleMention) {
                return message.reply('Podaj rolę! Użycie: `!weryfikacja rola-zweryfikowanych <@rola>`');
            }

            const roleId = roleMention.replace(/<@&/g, '').replace(/>/g, '');
            const role = guild.roles.cache.get(roleId);
            
            if (!role) {
                return message.reply('Nie znaleziono takiej roli!');
            }

            config.verifiedRoleId = role.id;
            await saveVerificationConfig(config);

            const embed = new EmbedBuilder()
                .setTitle('✅ Rola zweryfikowanych ustawiona')
                .setDescription(`Rola zweryfikowanych: ${role}`)
                .setColor(0x57F287);
            return message.reply({ embeds: [embed] });
        }

        case 'kanal':
        case 'kanał': {
            const channelMention = args[1];
            if (!channelMention) {
                return message.reply('Podaj kanał! Użycie: `!weryfikacja kanal <#kanał>`');
            }

            const channelId = channelMention.replace(/<#/g, '').replace(/>/g, '');
            const verificationChannel = guild.channels.cache.get(channelId);
            
            if (!verificationChannel) {
                return message.reply('Nie znaleziono takiego kanału!');
            }

            config.verificationChannelId = verificationChannel.id;
            await saveVerificationConfig(config);

            const embed = new EmbedBuilder()
                .setTitle('✅ Kanał weryfikacji ustawiony')
                .setDescription(`Kanał weryfikacji: ${verificationChannel}`)
                .setColor(0x57F287);
            return message.reply({ embeds: [embed] });
        }

        case 'logi': {
            const channelMention = args[1];
            if (!channelMention) {
                return message.reply('Podaj kanał! Użycie: `!weryfikacja logi <#kanał>`');
            }

            const channelId = channelMention.replace(/<#/g, '').replace(/>/g, '');
            const logChannel = guild.channels.cache.get(channelId);
            
            if (!logChannel) {
                return message.reply('Nie znaleziono takiego kanału!');
            }

            config.logChannelId = logChannel.id;
            await saveVerificationConfig(config);

            const embed = new EmbedBuilder()
                .setTitle('✅ Kanał logów ustawiony')
                .setDescription(`Kanał logów: ${logChannel}`)
                .setColor(0x57F287);
            return message.reply({ embeds: [embed] });
        }

        case 'captcha': {
            const option = args[1]?.toLowerCase();
            if (!option || !['wlacz', 'włącz', 'wylacz', 'wyłącz', 'latwy', 'łatwy', 'medium', 'trudny'].includes(option)) {
                return message.reply('Użycie: `!weryfikacja captcha <włącz/wyłącz/łatwy/medium/trudny>`');
            }

            if (option === 'wlacz' || option === 'włącz') {
                config.requireCaptcha = true;
            } else if (option === 'wylacz' || option === 'wyłącz') {
                config.requireCaptcha = false;
            } else if (option === 'latwy' || option === 'łatwy') {
                config.requireCaptcha = true;
                config.captchaDifficulty = 'easy';
            } else if (option === 'medium') {
                config.requireCaptcha = true;
                config.captchaDifficulty = 'medium';
            } else if (option === 'trudny') {
                config.requireCaptcha = true;
                config.captchaDifficulty = 'hard';
            }

            await saveVerificationConfig(config);

            const embed = new EmbedBuilder()
                .setTitle('✅ CAPTCHA zaktualizowana')
                .setDescription(`CAPTCHA: ${config.requireCaptcha ? `✅ Włączona (${config.captchaDifficulty})` : '❌ Wyłączona'}`)
                .setColor(0x57F287);
            return message.reply({ embeds: [embed] });
        }

        case 'auto': {
            const option = args[1]?.toLowerCase();
            if (!option || !['wlacz', 'włącz', 'wylacz', 'wyłącz'].includes(option)) {
                return message.reply('Użycie: `!weryfikacja auto <włącz/wyłącz>`');
            }

            config.autoVerifyOnJoin = (option === 'wlacz' || option === 'włącz');
            await saveVerificationConfig(config);

            const embed = new EmbedBuilder()
                .setTitle('✅ Auto-weryfikacja zaktualizowana')
                .setDescription(`Auto-weryfikacja: ${config.autoVerifyOnJoin ? '✅ Włączona' : '❌ Wyłączona'}`)
                .setColor(0x57F287);
            return message.reply({ embeds: [embed] });
        }

        case 'cooldown': {
            const seconds = parseInt(args[1]);
            if (isNaN(seconds) || seconds < 10 || seconds > 3600) {
                return message.reply('Podaj liczbę sekund (10-3600)! Użycie: `!weryfikacja cooldown <sekundy>`');
            }

            config.verificationCooldown = seconds;
            await saveVerificationConfig(config);

            const embed = new EmbedBuilder()
                .setTitle('✅ Cooldown zaktualizowany')
                .setDescription(`Cooldown: ${seconds} sekund`)
                .setColor(0x57F287);
            return message.reply({ embeds: [embed] });
        }

        case 'proby':
        case 'próby': {
            const attempts = parseInt(args[1]);
            if (isNaN(attempts) || attempts < 1 || attempts > 10) {
                return message.reply('Podaj liczbę prób (1-10)! Użycie: `!weryfikacja próby <liczba>`');
            }

            config.maxAttempts = attempts;
            await saveVerificationConfig(config);

            const embed = new EmbedBuilder()
                .setTitle('✅ Max prób zaktualizowany')
                .setDescription(`Max prób: ${attempts}`)
                .setColor(0x57F287);
            return message.reply({ embeds: [embed] });
        }

        case 'wiadomosc':
        case 'wiadomość': {
            const messageText = args.slice(1).join(' ');
            if (!messageText) {
                return message.reply('Podaj wiadomość! Użycie: `!weryfikacja wiadomość <tekst>`');
            }

            config.verificationMessage = messageText;
            await saveVerificationConfig(config);

            const embed = new EmbedBuilder()
                .setTitle('✅ Wiadomość zaktualizowana')
                .setDescription(`Nowa wiadomość: ${messageText}`)
                .setColor(0x57F287);
            return message.reply({ embeds: [embed] });
        }

        case 'przycisk': {
            const buttonText = args.slice(1).join(' ');
            if (!buttonText) {
                return message.reply('Podaj tekst przycisku! Użycie: `!weryfikacja przycisk <tekst>`');
            }

            config.verificationButtonText = buttonText;
            await saveVerificationConfig(config);

            const embed = new EmbedBuilder()
                .setTitle('✅ Przycisk zaktualizowany')
                .setDescription(`Nowy tekst przycisku: ${buttonText}`)
                .setColor(0x57F287);
            return message.reply({ embeds: [embed] });
        }

        case 'setup':
        case 'skonfiguruj': {
            if (!config.enabled) {
                return message.reply('Weryfikacja jest wyłączona! Najpierw ją włącz: `!weryfikacja włącz`');
            }

            if (!config.verificationChannelId) {
                return message.reply('Nie ustawiono kanału weryfikacji! Użyj: `!weryfikacja kanal <#kanał>`');
            }

            const verificationChannel = guild.channels.cache.get(config.verificationChannelId);
            if (!verificationChannel) {
                return message.reply('Kanał weryfikacji nie istnieje!');
            }

            // Utwórz embed weryfikacji
            const verificationEmbed = new EmbedBuilder()
                .setTitle('🔐 Weryfikacja')
                .setDescription(config.verificationMessage)
                .setColor(0x5865F2)
                .setFooter({ text: 'Kliknij przycisk poniżej, aby się zweryfikować' });

            // Utwórz przycisk
            const button = new ButtonBuilder()
                .setCustomId('verify_button')
                .setLabel(config.verificationButtonText)
                .setStyle(ButtonStyle.Success);

            if (config.verificationButtonEmoji) {
                button.setEmoji(config.verificationButtonEmoji);
            }

            const row = new ActionRowBuilder().addComponents(button);

            // Wyślij wiadomość weryfikacji
            await verificationChannel.send({ embeds: [verificationEmbed], components: [row] });

            const embed = new EmbedBuilder()
                .setTitle('✅ Weryfikacja skonfigurowana')
                .setDescription(`Wiadomość weryfikacji została wysłana na kanał ${verificationChannel}`)
                .setColor(0x57F287);
            return message.reply({ embeds: [embed] });
        }

        case 'reset': {
            const userId = args[1]?.replace(/<@!?/g, '').replace(/>/g, '');
            if (!userId) {
                return message.reply('Podaj użytkownika! Użycie: `!weryfikacja reset <@użytkownik>`');
            }

            if (config.verifiedUsers[userId]) {
                delete config.verifiedUsers[userId];
                await saveVerificationConfig(config);

                const embed = new EmbedBuilder()
                    .setTitle('✅ Reset weryfikacji')
                    .setDescription(`Weryfikacja użytkownika <@${userId}> została zresetowana`)
                    .setColor(0x57F287);
                return message.reply({ embeds: [embed] });
            } else {
                return message.reply('Ten użytkownik nie jest zweryfikowany!');
            }
        }

        case 'lista': {
            const verifiedCount = Object.keys(config.verifiedUsers).length;
            if (verifiedCount === 0) {
                return message.reply('Brak zweryfikowanych użytkowników!');
            }

            const verifiedList = Object.entries(config.verifiedUsers)
                .slice(0, 20)
                .map(([userId, data]) => `<@${userId}> - ${new Date(data.verifiedAt).toLocaleString('pl-PL')}`)
                .join('\n');

            const embed = new EmbedBuilder()
                .setTitle('📋 Lista zweryfikowanych użytkowników')
                .setDescription(verifiedList)
                .setColor(0x5865F2)
                .setFooter({ text: `Łącznie: ${verifiedCount} użytkowników` });

            return message.reply({ embeds: [embed] });
        }

        case 'pomoc':
        case 'help': {
            const helpEmbed = new EmbedBuilder()
                .setTitle('🔐 Pomoc - Weryfikacja')
                .setDescription('Dostępne podkomendy:')
                .addFields(
                    { name: 'Status', value: '`!weryfikacja` - Wyświetla status weryfikacji', inline: false },
                    { name: 'Włącz/Wyłącz', value: '`!weryfikacja włącz/wyłącz` - Włącza/wyłącza system', inline: false },
                    { name: 'Role', value: '`!weryfikacja rola-weryfikacji <@rola>` - Ustawia rolę weryfikacji\n`!weryfikacja rola-zweryfikowanych <@rola>` - Ustawia rolę zweryfikowanych', inline: false },
                    { name: 'Kanały', value: '`!weryfikacja kanal <#kanał>` - Ustawia kanał weryfikacji\n`!weryfikacja logi <#kanał>` - Ustawia kanał logów', inline: false },
                    { name: 'CAPTCHA', value: '`!weryfikacja captcha <włącz/wyłącz/łatwy/medium/trudny>` - Konfiguruje CAPTCHA', inline: false },
                    { name: 'Auto-weryfikacja', value: '`!weryfikacja auto <włącz/wyłącz>` - Włącza/wyłącza auto-weryfikację', inline: false },
                    { name: 'Ustawienia', value: '`!weryfikacja cooldown <sekundy>` - Ustawia cooldown\n`!weryfikacja próby <liczba>` - Ustawia max prób\n`!weryfikacja wiadomość <tekst>` - Ustawia wiadomość\n`!weryfikacja przycisk <tekst>` - Ustawia tekst przycisku', inline: false },
                    { name: 'Operacje', value: '`!weryfikacja setup` - Wysyła wiadomość weryfikacji\n`!weryfikacja reset <@użytkownik>` - Resetuje weryfikację\n`!weryfikacja lista` - Wyświetla listę zweryfikowanych', inline: false }
                )
                .setColor(0x5865F2);

            return message.reply({ embeds: [helpEmbed] });
        }

        default:
            return message.reply('Nieznana podkomenda! Użyj `!weryfikacja pomoc` aby zobaczyć dostępne opcje.');
    }
}

// Eksportuj funkcje do użycia w innych plikach
export { loadVerificationConfig, saveVerificationConfig, generateCaptcha };
