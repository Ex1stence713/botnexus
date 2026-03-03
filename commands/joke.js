import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const jokes = [
  { setup: 'Dlaczego komputerowi nigdy nie jest zimno?', punchline: 'Bo zawsze ma Windows!' },
  { setup: 'Co mówi informatyk, gdy wchodzi do windy?', punchline: 'Enter.' },
  { setup: 'Dlaczego programista nie może przejść przez ulicę?', punchline: 'Bo czeka na zielone światło na klawiaturze.' },
  { setup: 'Jak nazywa się kot programisty?', punchline: 'Scratch!' },
  { setup: 'Dlaczego Java nie może grać w chowanego?', punchline: 'Bo zawsze jest publiczna!' },
  { setup: 'Co robi programista po śmierci?', punchline: 'Zostaje zdeklarowany jako martwy.' },
  { setup: 'Ile programistów potrzeba do wkręcenia żarówki?', punchline: 'Żadnego — to problem sprzętowy.' },
  { setup: 'Dlaczego programiści lubią naturę?', punchline: 'Bo ma mniej bugów niż kod.' },
  { setup: 'Jak nazywa się pirat, który koduje?', punchline: 'R8 (rate) — bo ciągle używa "arr".' },
  { setup: 'Dlaczego frontendowcy piją kawę?', punchline: 'Bo bez niej nie ma stylu (CSS).' },
  { setup: 'Jak debugger nazwał swoją dziewczynę?', punchline: '"Myślę, że to błąd, ale i tak ją kocham()".' },
  { setup: 'Dlaczego programista zabrał żonę na randkę do serwera?', punchline: 'Bo chciał pokazać jej, że ma dobrą sesję.' }
];

export const data = new SlashCommandBuilder()
  .setName('joke')
  .setDescription('Wyświetla losowy żart');

export async function execute(interaction) {
  const joke = jokes[Math.floor(Math.random() * jokes.length)];
  
  const embed = new EmbedBuilder()
    .setColor('#FFA500')
    .setTitle('😂 Żart')
    .setDescription(`**${joke.setup}**\n\n||${joke.punchline}||`)
    .setFooter({ text: `${jokes.length} żartów w bazie` })
    .setTimestamp();
  
  await interaction.reply({ embeds: [embed] });
}