import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fish = [
  { name: '🐟 Płotka', chance: 40, coins: 5 },
  { name: '🐠 Karaś', chance: 30, coins: 10 },
  { name: '🐡 Okoń', chance: 15, coins: 20 },
  { name: '🦈 Szczupak', chance: 8, coins: 50 },
  { name: '🐋 Suma', chance: 5, coins: 100 },
  { name: '✨ Złota Rybka', chance: 1.5, coins: 500 },
  { name: '👢 Stary But', chance: 0.5, coins: -10 }
];

const cooldowns = new Map();
const COOLDOWN_TIME = 30000;

const dataPath = path.join(__dirname, '..', 'data', 'coins.json');

function loadCoins() {
  if (!fs.existsSync(path.dirname(dataPath))) {
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  }
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, '{}');
    return {};
  }
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

function saveCoins(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function catchFish() {
  const random = Math.random() * 100;
  let cumulative = 0;
  
  for (const f of fish) {
    cumulative += f.chance;
    if (random <= cumulative) return f;
  }
  
  return fish[0];
}

export const data = new SlashCommandBuilder()
  .setName('lowrybe')
  .setDescription('Spróbuj złowić rybę!');
  
export async function execute(interaction) {
  const userId = interaction.user.id;
  
  if (cooldowns.has(userId)) {
    const expirationTime = cooldowns.get(userId) + COOLDOWN_TIME;
    const timeLeft = Math.ceil((expirationTime - Date.now()) / 1000);
    
    if (Date.now() < expirationTime) {
      return interaction.reply({
        content: `🎣 Musisz poczekać jeszcze ${timeLeft} sekund zanim znowu zarzucisz wędkę!`,
        ephemeral: true
      });
    }
  }
  
  cooldowns.set(userId, Date.now());
  setTimeout(() => cooldowns.delete(userId), COOLDOWN_TIME);
  
  await interaction.reply('🎣 Zarzucasz wędkę...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const caughtFish = catchFish();
  const coins = loadCoins();
  
  if (!coins[userId]) coins[userId] = 0;
  coins[userId] += caughtFish.coins;
  saveCoins(coins);
  
  const embed = new EmbedBuilder()
    .setColor(caughtFish.coins > 0 ? '#00ff00' : '#ff0000')
    .setTitle('🎣 Rezultat Łowienia')
    .setDescription(`**${interaction.user.username}** złowił: ${caughtFish.name}!`)
    .addFields(
      { name: '💰 Nagroda', value: `${caughtFish.coins > 0 ? '+' : ''}${caughtFish.coins} monet`, inline: true },
      { name: '💵 Stan konta', value: `${coins[userId]} monet`, inline: true },
      { name: '⏰ Następne łowienie', value: 'za 30 sekund', inline: true }
    )
    .setTimestamp()
    .setFooter({ text: 'Łowienie Ryb' });
  
  await interaction.editReply({ content: null, embeds: [embed] });
}