import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch'; // Pamiętaj o npm install node-fetch

export const data = new SlashCommandBuilder()
  .setName('pogoda')
  .setDescription('Sprawdza aktualną pogodę w danym mieście')
  .addStringOption(option => option.setName('miasto').setDescription('Nazwa miasta').setRequired(true));

export async function execute(interaction) {
  const city = interaction.options.getString('miasto');
  // Uwaga: Potrzebujesz darmowego klucza z openweathermap.org
  const apiKey = '1d63fe185b3f27e609be6a6f51dd79ca'; // Wstaw swój klucz API tutaj
  
  const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=pl&appid=${apiKey}`);
  const data = await response.json();

  if (data.cod !== 200) return interaction.reply({ content: '❌ Nie znaleziono takiego miasta.', ephemeral: true });

  const embed = new EmbedBuilder()
    .setTitle(`☀️ Pogoda: ${data.name}`)
    .addFields(
      { name: 'Temperatura', value: `${Math.round(data.main.temp)}°C`, inline: true },
      { name: 'Odczuwalna', value: `${Math.round(data.main.feels_like)}°C`, inline: true },
      { name: 'Wilgotność', value: `${data.main.humidity}%`, inline: true },
      { name: 'Opis', value: data.weather[0].description }
    )
    .setColor('#0099ff')
    .setThumbnail(`http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`);

  await interaction.reply({ embeds: [embed] });
}