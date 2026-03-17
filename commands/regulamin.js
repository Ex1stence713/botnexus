import { EmbedBuilder } from 'discord.js';

export const name = 'regulamin';
export const description = 'Publikuje regulamin';

// static rules text
const rulesText = `1. Nieznajomość regulaminu nie zwalnia cię z jego przestrzegania. Korzystając z serwera Discord, akceptujesz warunki regulaminu.
2. Okazuj szacunek wszystkim na serwerze - obrażanie, nękanie, dyskryminacja i wszelkie formy agresji są zabronione.
2. Nie spamuj - Nie wysyłaj wielu podobnych wiadomości pod rząd oraz nie spam reakcjami.
3. Zakaz reklamowania innych serwerów, kanałów, stron, forów itp. bez uprzedniego uzyskania zgody Administracji
4. Decyzje administracji są ostateczne. Wszelkie skargi i odwołania od decyzji należy zgłaszać prywatnie do administratorów.
5. Używaj odpowiednich kanałów do rozmów na dany temat.
6. Udostępnianie jakichkolwiek prywatnych danych osobowych (imię i nazwisko, zdjęcia, adresy zamieszkania itp) bez pozwolenia danej osoby jest karane banem permanentnym
7. Zakazuje się publikacji treści nazistowskich, homofobicznych, NFSW powszechnie uznawanych za wulgarne, obraźliwe i niewłaściwe.
8. Ogranicz przeklinanie do minimum. **Tyczy się wszystkich nawet administracji.**
9. Każdy użytkownik ma obowiązek przypisania sobie rangi zgodnej z rzeczywistym wiekiem oraz płcią. W przypadku wykrycia niezgodności lub celowego wprowadzenia w błąd, administratorzy zastrzegają sobie prawo do ukarania osoby banem permanentnym.
10. Zakaz pingowania losowych osób oraz administracji bez konkretnego powodu.
11. Zakaz przenoszenia problemów z chat'ów prywatnych i grup na publiczny
12. Administracja zastrzega sobie prawo do modyfikacji regulaminu w dowolnym momencie.
13. Szanuj uczestników rozmów głosowych, unikaj hałasów i treści zakłócających.
14. Wszelkie formy nadużyć i wykorzystywania błędów serwera w sposób sprzeczny z jego celem i zasadami będą obarczone konsekwencjami.`;

export async function execute(message, args) {
    if (!message.member?.permissions.has('ManageMessages')) {
        return message.reply('Nie masz uprawnień do używania tej komendy!');
    }
    
    if (args.length === 0) {
        return message.reply('Podaj kanał! Użycie: !regulamin <#kanal>');
    }
    
    if (!message.guild) {
        return message.reply('Ta komenda działa tylko na serwerze!');
    }
    
    const channelMention = args[0];
    const channelId = channelMention.replace(/<#|>/g, '');
    const channel = message.guild.channels.cache.get(channelId);

    if (!channel) {
        return message.reply('Nie znaleziono kanału!');
    }

    if (!channel.isTextBased?.()) {
        return message.reply('Wybrany kanał nie pozwala na wysyłanie wiadomości!');
    }

    const embed = new EmbedBuilder()
        .setAuthor({
            name: '📜 Regulamin',
            iconURL: message.guild.iconURL()
        })
        .setDescription(rulesText)
        .setColor('#5865F2')
        .setFooter({
            text: `${message.guild.name} • Regulamin`,
            iconURL: message.guild.iconURL()
        })
        .setTimestamp();

    try {
        await channel.send({ embeds: [embed] });
        return message.reply(`✅ Wysłano regulamin na kanał <#${channel.id}>`);
    } catch (err) {
        console.error('Błąd przy wysyłaniu regulaminu:', err);
        return message.reply('❌ Nie udało się wysłać regulaminu!');
    }
}
