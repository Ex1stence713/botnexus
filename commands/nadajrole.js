import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import fs from 'fs/promises';

const VERIFICATION_FILE = 'data/verification.json';

// Ładuj konfigurację weryfikacji
async function loadVerificationConfig() {
    try {
        const data = await fs.readFile(VERIFICATION_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
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

export const name = 'nadajrole';
export const description = 'Nadaje wybraną rolę wszystkim użytkownikom na serwerze';

export async function execute(message, args) {
    const { guild, member, author } = message;

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

    // Sprawdź czy podano argumenty
    if (args.length === 0) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Błąd')
            .setDescription('Podaj rolę! Możesz użyć:\n• Nazwy roli\n• Wzmianki roli (@rola)\n• ID roli')
            .addFields(
                { name: 'Użycie', value: '`!nadajrole <rola> [--bots]`' },
                { name: 'Weryfikacja', value: '`!nadajrole weryfikacja <@rola>` - Ustawia rolę weryfikacji\n`!nadajrole zweryfikowani <@rola>` - Ustawia rolę zweryfikowanych' }
            )
            .setColor(0xED4245);
        return message.reply({ embeds: [embed] });
    }

    // Podkomendy weryfikacji
    const subcommand = args[0]?.toLowerCase();

    if (subcommand === 'weryfikacja') {
        const roleMention = args[1];
        if (!roleMention) {
            return message.reply('Podaj rolę! Użycie: `!nadajrole weryfikacja <@rola>`');
        }

        const roleId = roleMention.replace(/<@&/g, '').replace(/>/g, '');
        const role = guild.roles.cache.get(roleId);
        
        if (!role) {
            return message.reply('Nie znaleziono takiej roli!');
        }

        const config = await loadVerificationConfig();
        config.verificationRoleId = role.id;
        await saveVerificationConfig(config);

        const embed = new EmbedBuilder()
            .setTitle('✅ Rola weryfikacji ustawiona')
            .setDescription(`Rola weryfikacji: ${role}`)
            .setColor(0x57F287);
        return message.reply({ embeds: [embed] });
    }

    if (subcommand === 'zweryfikowani') {
        const roleMention = args[1];
        if (!roleMention) {
            return message.reply('Podaj rolę! Użycie: `!nadajrole zweryfikowani <@rola>`');
        }

        const roleId = roleMention.replace(/<@&/g, '').replace(/>/g, '');
        const role = guild.roles.cache.get(roleId);
        
        if (!role) {
            return message.reply('Nie znaleziono takiej roli!');
        }

        const config = await loadVerificationConfig();
        config.verifiedRoleId = role.id;
        await saveVerificationConfig(config);

        const embed = new EmbedBuilder()
            .setTitle('✅ Rola zweryfikowanych ustawiona')
            .setDescription(`Rola zweryfikowanych: ${role}`)
            .setColor(0x57F287);
        return message.reply({ embeds: [embed] });
    }

    if (subcommand === 'status') {
        const config = await loadVerificationConfig();
        
        const embed = new EmbedBuilder()
            .setTitle('🔐 Status weryfikacji')
            .addFields(
                { name: 'Włączona', value: config.enabled ? '✅ Tak' : '❌ Nie', inline: true },
                { name: 'Rola weryfikacji', value: config.verificationRoleId ? `<@&${config.verificationRoleId}>` : 'Nie ustawiona', inline: true },
                { name: 'Rola zweryfikowanych', value: config.verifiedRoleId ? `<@&${config.verifiedRoleId}>` : 'Nie ustawiona', inline: true },
                { name: 'CAPTCHA', value: config.requireCaptcha ? `✅ Tak (${config.captchaDifficulty})` : '❌ Nie', inline: true },
                { name: 'Zweryfikowani', value: `${Object.keys(config.verifiedUsers).length} użytkowników`, inline: true }
            )
            .setColor(0x5865F2);
        return message.reply({ embeds: [embed] });
    }

    // Sprawdź flagę --bots
    const includeBots = args.includes('--bots');
    const roleArgs = args.filter(arg => arg !== '--bots');

    if (roleArgs.length === 0) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Błąd')
            .setDescription('Podaj rolę poza flagą --bots!')
            .setColor(0xED4245);
        return message.reply({ embeds: [embed] });
    }

    // Znajdź rolę
    let role;
    const roleInput = roleArgs.join(' ');

    // Sprawdź czy to wzmianka roli
    const mentionMatch = roleInput.match(/<@&(\d+)>/);
    if (mentionMatch) {
        role = guild.roles.cache.get(mentionMatch[1]);
    }
    // Sprawdź czy to ID roli
    else if (/^\d+$/.test(roleInput)) {
        role = guild.roles.cache.get(roleInput);
    }
    // Szukaj po nazwie
    else {
        role = guild.roles.cache.find(r => 
            r.name.toLowerCase() === roleInput.toLowerCase()
        );
    }

    if (!role) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Nie znaleziono roli')
            .setDescription(`Nie udało się znaleźć roli: **${roleInput}**`)
            .setColor(0xED4245);
        return message.reply({ embeds: [embed] });
    }

    // Sprawdź czy bot może zarządzać tą rolą
    if (guild.members.me.roles.highest.position <= role.position) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Brak uprawnień')
            .setDescription('Bot nie może zarządzać tą rolą (rola bota jest na tym samym lub niższym poziomie).')
            .setColor(0xED4245);
        return message.reply({ embeds: [embed] });
    }

    // Pobierz członków
    let members;
    try {
        members = await guild.members.fetch({ limit: 1000, time: 30000 });
    } catch (error) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Błąd')
            .setDescription('Nie udało się pobrać listy członków serwera.')
            .setColor(0xED4245);
        return message.reply({ embeds: [embed] });
    }

    // Filtruj członków
    const targetMembers = members.filter(m => {
        if (!includeBots && m.user.bot) return false;
        if (m.roles.cache.has(role.id)) return false;
        return true;
    });

    if (targetMembers.size === 0) {
        const embed = new EmbedBuilder()
            .setTitle('ℹ️ Informacja')
            .setDescription(includeBots 
                ? `Wszyscy członkowie (łącznie z botami) już mają rolę **${role.name}**.`
                : `Wszyscy użytkownicy już mają rolę **${role.name}**. Użyj flagi \`--bots\`, aby uwzględnić boty.`)
            .setColor(0x5865F2);
        return message.reply({ embeds: [embed] });
    }

    // Potwierdzenie przed wykonaniem
    const confirmEmbed = new EmbedBuilder()
        .setTitle('⚠️ Potwierdzenie')
        .setDescription(`Czy na pewno chcesz nadać rolę **${role.name}** **${targetMembers.size}** użytkownikom?`)
        .addFields(
            { name: 'Rola', value: `${role}`, inline: true },
            { name: 'Liczba użytkowników', value: `${targetMembers.size}`, inline: true },
            { name: 'Uwzględniono boty', value: includeBots ? 'Tak' : 'Nie', inline: true }
        )
        .setColor(0xFEE75C)
        .setFooter({ text: 'Odpowiedz "tak" w ciągu 30 sekund, aby potwierdzić.' });

    const confirmMsg = await message.reply({ embeds: [confirmEmbed] });

    // Czekaj na potwierdzenie
    const filter = (m) => m.author.id === author.id && ['tak', 'yes', 'y'].includes(m.content.toLowerCase());
    const collector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async (m) => {
        try {
            // Aktualizuj wiadomość potwierdzającą
            const processingEmbed = new EmbedBuilder()
                .setTitle('⏳ Przetwarzanie...')
                .setDescription(`Nadawanie roli **${role.name}** użytkownikom...`)
                .setColor(0x5865F2);
            await confirmMsg.edit({ embeds: [processingEmbed] });

            // Nadawaj role z opóźnieniem (ochrona przed rate limit)
            let successCount = 0;
            let failCount = 0;
            const errors = [];

            for (const [id, member] of targetMembers) {
                try {
                    await member.roles.add(role);
                    successCount++;
                } catch (err) {
                    failCount++;
                    errors.push(`${member.user.tag}: ${err.message}`);
                    console.error(`[nadajrole] Błąd przy nadawaniu roli ${member.user.tag}:`, err.message);
                }

                // Opóźnienie między operacjami (500ms)
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Wynik
            const resultEmbed = new EmbedBuilder()
                .setTitle('✅ Operacja zakończona')
                .setDescription(`Nadawanie roli **${role.name}** zostało zakończone.`)
                .addFields(
                    { name: 'Pomyślnie nadano', value: `${successCount}`, inline: true },
                    { name: 'Błędy', value: `${failCount}`, inline: true },
                    { name: 'Łącznie', value: `${targetMembers.size}`, inline: true }
                )
                .setColor(0x57F287);

            if (errors.length > 0 && errors.length <= 5) {
                resultEmbed.addFields({ 
                    name: 'Szczegóły błędów', 
                    value: errors.slice(0, 5).join('\n') 
                });
            } else if (errors.length > 5) {
                resultEmbed.addFields({ 
                    name: 'Szczegóły błędów', 
                    value: `${errors.slice(0, 3).join('\n')}\n...i ${errors.length - 3} więcej` 
                });
            }

            await confirmMsg.edit({ embeds: [resultEmbed] });

        } catch (error) {
            console.error('[nadajrole] Błąd krytyczny:', error);
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Błąd krytyczny')
                .setDescription(`Wystąpił błąd podczas nadawania ról: ${error.message}`)
                .setColor(0xED4245);
            await confirmMsg.edit({ embeds: [errorEmbed] });
        }
    });

    collector.on('end', (collected) => {
        if (collected.size === 0) {
            const timeoutEmbed = new EmbedBuilder()
                .setTitle('⏰ Czas minął')
                .setDescription('Nie potwierdzono operacji w ciągu 30 sekund.')
                .setColor(0xED4245);
            confirmMsg.edit({ embeds: [timeoutEmbed] }).catch(() => {});
        }
    });
}
