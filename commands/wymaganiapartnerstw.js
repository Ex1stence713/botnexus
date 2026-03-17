import { EmbedBuilder } from 'discord.js';

export const name = 'wymaganiapartnerstw';
export const description = 'Wyświetla szczegółowe wymagania dotyczące partnerstw na tym serwerze.';

export async function execute(message, args) {
    try {
        const embed = new EmbedBuilder()
            .setColor('#00C3FF')
            .setTitle('✨ Wymagania Partnerstw')
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/616/616494.png')
            .setDescription(
                'Chcesz nawiązać **partnerstwo** z naszym serwerem?\n' +
                'Zapoznaj się z wymaganiami i dołącz do naszej społeczności partnerów!\n\n' +
                '> **Partnerstwo to szansa na rozwój i wspólne akcje!**'
            )
            .addFields(
                { name: '1✮⋆˙ Serwer nie może być typu NSFW', value: 'Serwer musi być odpowiedni dla wszystkich kategorii wiekowych.', inline: false },
                { name: '2✮⋆˙ Minimalna liczba aktywnych członków', value: 'Serwer musi posiadać **minimum 50 aktywnych członków** (bez botów).', inline: false },
                { name: '3✮⋆˙ Opuszczenie serwera', value: 'W przypadku opuszczenia serwera przez osobę zawierającą partnerstwo, **reklama zostaje usunięta**.', inline: false },
                { name: '4✮⋆˙ Jak się zgłosić?', value: 'Aby nawiązać partnerstwo, zrób ticketa w odpowiednim kanale.\n\n**Każdy właściciel partnerskiego serwera otrzymuje rangę**', inline: false },
                { name: '5✮⋆˙ Aktywności', value: 'W przypadku braku aktywności na serwerze reklama zostaje usunięta.', inline: false }
            )
            .setFooter({ text: 'Masz pytania? Skontaktuj się z administracją!' })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    } catch (error) {
        console.error(error);
        await message.reply('❌ Błąd przy wykonywaniu komendy.');
    }
}
