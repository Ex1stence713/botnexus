import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

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
11. Zakaz przenoszenia problemów z chat’ów prywatnych i grup na publiczny
12. Administracja zastrzega sobie prawo do modyfikacji regulaminu w dowolnym momencie.
13. Szanuj uczestników rozmów głosowych, unikaj hałasów i treści zakłócających.
14. Wszelkie formy nadużyć i wykorzystywania błędów serwera w sposób sprzeczny z jego celem i zasadami będą obarczone konsekwencjami.`;

export const data = new SlashCommandBuilder()
    .setName('regulamin')
    .setDescription('Publikuje regulamin')
    .addChannelOption(option =>
        option.setName('kanal')
            .setDescription('Kanał, do którego zostanie wysłany regulamin')
            .setRequired(true))
    .addRoleOption(option =>
        option.setName('ping')
            .setDescription('Rola do pingowania (opcjonalne)')
            .setRequired(false))
    .addStringOption(option =>
        option.setName('miniatura')
            .setDescription('Link do miniaturki (opcjonalne)')
            .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction) {
    const channel = interaction.options.getChannel('kanal');
    const pingRole = interaction.options.getRole('ping');
    const thumbnail = interaction.options.getString('miniatura');

    const embed = new EmbedBuilder()
        .setAuthor({
            name: '📜 Regulamin',
            iconURL: interaction.guild.iconURL()
        })
        .setDescription(rulesText)
        .setColor('#5865F2')
        .setFooter({
            text: `${interaction.guild.name} • Regulamin`,
            iconURL: interaction.guild.iconURL()
        })
        .setTimestamp();

    if (thumbnail) {
        embed.setThumbnail(thumbnail);
    }

    if (!channel) {
        return interaction.reply({ content: '❌ Nie znaleziono kanału.', ephemeral: true });
    }

    if (!channel.isTextBased?.()) {
        return interaction.reply({ content: '❌ Wybrany kanał nie pozwala na wysyłanie wiadomości.', ephemeral: true });
    }

    try {
        const messageContent = pingRole ? `${pingRole} 📜` : '';
        await channel.send({ content: messageContent, embeds: [embed] });
        return interaction.reply({
            content: `✅ Wysłano regulamin na kanał <#${channel.id}>${pingRole ? ` z pingiem ${pingRole}` : ''}.`,
            ephemeral: true
        });
    } catch (err) {
        console.error('Błąd przy wysyłaniu regulaminu:', err);
        return interaction.reply({ content: '❌ Nie udało się wysłać regulaminu na wybrany kanał.', ephemeral: true });
    }
}