import { EmbedBuilder } from 'discord.js';

export const name = 'hack';
export const description = 'Prank hakowania (tylko dla zabawy)';

export async function execute(message, args) {
    if (args.length === 0) {
        return message.reply('Podaj użytkownika! Użycie: !hack <@użytkownik>');
    }
    
    const userId = args[0].replace(/<@!?/g, '').replace(/>/g, '');
    let targetUser;
    
    try {
        targetUser = await message.client.users.fetch(userId);
    } catch {
        return message.reply('Nie znaleziono użytkownika!');
    }

    const steps = [
        { text: 'Inicjowanie połączenia...', percent: 10 },
        { text: 'Omijanie zabezpieczeń firewall...', percent: 25 },
        { text: 'Pobieranie danych użytkownika...', percent: 40 },
        { text: 'Decyprowanie haseł...', percent: 60 },
        { text: 'Kopiowanie plików systemowych...', percent: 80 },
        { text: 'Usuwanie śladów...', percent: 95 },
        { text: 'HAKOWANIE ZAKOŃCZONE!', percent: 100 }
    ];

    const embed = new EmbedBuilder()
        .setTitle('💻 Hackowanie w toku...')
        .setColor(0xFF0000)
        .setDescription(`Target: **${targetUser.tag}**`)
        .addFields(
            { name: '📊 Postęp', value: '```\n██████████░░░░░░░ 10%\n```', inline: false }
        )
        .setFooter({ text: 'BotNexus • Tylko żart!' })
        .setTimestamp();

    const statusMessage = await message.reply({ embeds: [embed] });

    for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const bar = '█'.repeat(Math.floor(step.percent / 10)) + '░'.repeat(10 - Math.floor(step.percent / 10));
        
        const resultEmbed = new EmbedBuilder()
            .setTitle('💻 Hackowanie w toku...')
            .setColor(step.percent === 100 ? 0x57F287 : 0xFF0000)
            .setDescription(`Target: **${targetUser.tag}**`)
            .addFields(
                { name: '📊 Postęp', value: `\`\`\`\n${bar} ${step.percent}%\n\`\`\``, inline: false },
                { name: '⏳ Status', value: step.text, inline: false }
            )
            .setFooter({ text: 'BotNexus • Tylko żart!' })
            .setTimestamp();

        await statusMessage.edit({ embeds: [resultEmbed] });
    }

    const finalEmbed = new EmbedBuilder()
        .setTitle('💀 HAKOWANIE ZAKOŃCZONE!')
        .setColor(0x57F287)
        .setDescription(`Target: **${targetUser.tag}**`)
        .addFields(
            { name: '💾 Skradzione dane', value: '```\n- E-mail: user@gmail.com\n- Hasło: ********\n- Konto bankowe: $0\n```', inline: false },
            { name: '🎉', value: 'Prank zakończony! Wszystkie dane są fałszywe. 😄', inline: false }
        )
        .setFooter({ text: 'BotNexus • To był tylko żart!' })
        .setTimestamp();

    await statusMessage.edit({ embeds: [finalEmbed] });
}