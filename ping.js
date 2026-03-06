import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Sprawdź ping bota');

export async function execute(interaction) {
  // calculate ping based on heartbeat latency
  const ping = Math.round(interaction.client.ws.ping);
  await interaction.reply(`🏓 Pong! Ping: ${ping}ms`);
}
